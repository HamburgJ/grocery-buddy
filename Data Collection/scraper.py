import asyncio
from flipp_api.models import Merchants, Scrapers, Flyers, Items, Categories, ItemCategorizations, CanonicalItem, CanonicalCategory
from flipp_api.db import init_db
from flipp_api.backflipp import *
from datetime import datetime
from typing import List
import ftfy
import re
import nltk
from db_updater import DBUpdater
from nltk.stem import WordNetLemmatizer
from text.text_constants import *
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.spatial.distance import cosine

def similarity(text1, text2):
    """
    Calculate the cosine similarity between two text strings.
    """
    # Create a TF-IDF vectorizer
    vectorizer = TfidfVectorizer()

    # Fit and transform the text
    X = vectorizer.fit_transform([text1, text2])

    # Extract the 1-dimensional vectors from the sparse matrix
    v1 = X[0].toarray().flatten()
    v2 = X[1].toarray().flatten()

    # Calculate the cosine similarity
    return 1 - cosine(v1, v2)

def parse_items_from_multiple_names(names):
    # Parse items from multiple names
    # start at rightmost item. A new item can be created once a word is found with at least 2 characters (alphabetical)
    #, then a separator word is found (and, or, ,).
    # right to left parsing is used as we want something like "blueberries, 200g" to not split
    # but something like "blueberries or raspberries" should split
    result = []  # list of names found. If no splits, this will contain the original name
    separators = ['and', 'or', ',']
    # Split words, ensuring commas are treated as separate tokens
    words = re.split(r'(\s+|,)', names)
    current_item = []
    found_alpha_word = False
    for word in reversed(words):
        if word.strip() in separators and current_item and found_alpha_word:
            result.append(' '.join(reversed(current_item)).strip())
            current_item = []
            found_alpha_word = False
        elif word.strip():  # Ignore empty strings from split
            current_item.append(word.strip())
            if re.search(r'[a-zA-Z]{2,}', word):
                found_alpha_word = True
    if current_item:
        result.append(' '.join(reversed(current_item)).strip())
    return result

# Ensure the WordNet data is downloaded for lemmatization
nltk.download('wordnet')
nltk.download('omw-1.4')
postal_codes = ['K1P1J1', 'M5R2E3', 'N2L3G1', 'K7L3N6']

class NightlyScraper:
    def __init__(self):
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(init_db())

    async def scrape_new_flyers_async(self):
        """Scrape new flyers for all merchants in the scrapers collection"""
        print("Starting nightly flyer scrape...")
        scrapers = await Scrapers.find_all().to_list()
        
        for scraper in scrapers:
            merchant = await Merchants.find_one({"merchant_id": scraper.merchant_id})
            if not merchant:
                print(f"Warning: No merchant found for scraper {scraper.merchant_id}")
                continue

            print(f"Checking flyers for {merchant.name}...")
            
            # First collect all new flyers across postal codes
            all_new_flyers = []
            all_new_flyer_ids = []
            
            # Get all existing flyers for this merchant
            existing_flyer_ids = {
                flyer.flyer_id 
                for flyer in await Flyers.find({"merchant_id": merchant.merchant_id}).to_list()
            }
            
            # Get current flyers for this merchant's postal codes
            for postal_code in postal_codes:
                flyer_ids = get_merchant_flyer_ids(merchant.name_identifier, postal_code)
                
                # Filter to only new flyers that aren't already in DB or current batch
                new_flyer_ids = [
                    fid for fid in flyer_ids 
                    if fid not in existing_flyer_ids and 
                    fid not in all_new_flyer_ids
                ]
                
                if not new_flyer_ids:
                    print(f"No new flyers found for {merchant.name} in {postal_code}")
                    continue

                print(f"Found {len(new_flyer_ids)} new flyers for {merchant.name} in {postal_code}")
                
                # Create new flyer documents
                new_flyers = [
                    Flyers(
                        flyer_id=flyer_id,
                        merchant_id=merchant.merchant_id,
                        postal_code=postal_code,
                        scraped=False
                    ) 
                    for flyer_id in new_flyer_ids
                ]
                
                all_new_flyers.extend(new_flyers)
                all_new_flyer_ids.extend(new_flyer_ids)

            # Insert all new flyers at once
            if all_new_flyers:
                await Flyers.insert_many(all_new_flyers)
                print(f"Added {len(all_new_flyers)} total new flyers for {merchant.name}")

                # Update metadata for all new flyers
                remaining_flyer_ids = set(all_new_flyer_ids)
                for postal_code in postal_codes:
                    if not remaining_flyer_ids:
                        break
                        
                    flyers_info = get_grocery_flyers(postal_code)
                    for flyer in flyers_info:
                        if flyer['id'] in remaining_flyer_ids:
                            categories = flyer.get('categories_csv', '')
                            if 'Groceries' not in categories:
                                await Flyers.find_one({"flyer_id": flyer['id']}).delete()
                            else:
                                await Flyers.find_one({"flyer_id": flyer['id']}).update({
                                    "$set": {
                                        "valid_from": flyer.get('valid_from'),
                                        "valid_to": flyer.get('valid_to'),
                                        "available_from": flyer.get('available_from'),
                                        "available_to": flyer.get('available_to'),
                                        "categories_csv": categories
                                    }
                                })
                            remaining_flyer_ids.remove(flyer['id'])
                # delete the ones not found
                for flyer_id in remaining_flyer_ids:
                    await Flyers.find_one({"flyer_id": flyer_id}).delete()
                    
            # Update scraper last run time
            scraper.last_run = datetime.now()
            await scraper.save()

    async def process_flyer_items(self, postal_code: str) -> List[Items]:
        """Process all items from the given flyers using aggregation pipeline"""
        print(f"Processing flyer items for {postal_code}...")
        
        # Get unprocessed flyers and their items in one query
        pipeline = [
            {
                "$match": {
                    "scraped": False
                }
            },
            {
                "$lookup": {
                    "from": "Items",
                    "localField": "flyer_id",
                    "foreignField": "flyer_id",
                    "as": "existing_items"
                }
            }
        ]
        
        flyer_results = await Flyers.aggregate(pipeline).to_list()
        all_new_items = []
        
        for flyer_data in flyer_results:
            existing_item_ids = {item['item_id'] for item in flyer_data['existing_items']}
            
            # Get items from flyer API
            items = get_flyer_items(flyer_data['flyer_id'], postal_code)
            new_items = [
                Items(
                    item_id=item['id'],
                    flyer_id=flyer_data['flyer_id'], 
                    merchant_id=flyer_data['merchant_id'],
                    name=item.get('name', ''),
                    description=item.get('description', ''),
                    price=item.get('price', ''),
                    discount=item.get('discount', ''),
                    valid_from=item.get('valid_from', ''),
                    valid_to=item.get('valid_to', ''),
                    cutout_image_url=item.get('cutout_image_url', ''),
                    brand=item.get('brand', ''),
                    categories=[]
                )
                for item in items
                if item['id'] not in existing_item_ids
            ]
            
            if new_items:
                # Update this line to only pass item_id
                item_details = [get_item_info(item.item_id) for item in new_items]
                
                # Update items with details
                fields = [
                    'brand', 'name', 'image_url', 'cutout_image_url', 'description', 'current_price',
                    'current_price_range', 'pre_price_text', 'category', 'price_text', 'sale_story',
                    'sku', 'ttm_url'
                ]
                
                for item, details in zip(new_items, item_details):
                    for field in fields:
                        setattr(item, field, details.get(field))
                        
                await Items.insert_many(new_items)
                all_new_items.extend(new_items)
                
            # Mark flyer as scraped
            await Flyers.find_one({"_id": flyer_data['_id']}).update({"$set": {"scraped": True}})

        return all_new_items

    async def fetch_category_items(self, new_item_ids: List[str], new_items: List[Items]):
        """Fetch category items only for new items found in this scrape"""
        print("Fetching category items...")
        
        # Get all canonical categories
        canonical_categories = await CanonicalCategory.find_all().to_list()
        
        # Get all new items with their flyer postal codes
        flyer_ids = {item.flyer_id for item in new_items}
        flyers = await Flyers.find({"flyer_id": {"$in": list(flyer_ids)}}).to_list()
        flyer_postal_codes = {flyer.flyer_id: flyer.postal_code for flyer in flyers}
        
        # Track item->categories mapping
        item_categories = {}
        
        # For each canonical category, fetch items and update the category
        for canonical_category in canonical_categories:
            if not canonical_category.categories:
                continue
            
            for category_name in canonical_category.categories:
                # Group by postal code to minimize API calls
                for postal_code in set(flyer_postal_codes.values()):
                    items = get_category_items(category_name, postal_code)
                    # Only process items that were found in this scrape
                    new_category_items = [item for item in items if item['id'] in new_item_ids]
                    
                    for item in new_category_items:
                        if item['id'] not in item_categories:
                            item_categories[item['id']] = set()
                        item_categories[item['id']].add(canonical_category.name)
        
        # Delete items that weren't found in any category
        items_to_delete = set(new_item_ids) - set(item_categories.keys())
        if items_to_delete:
            await Items.find({"item_id": {"$in": list(items_to_delete)}}).delete()
            print(f"Deleted {len(items_to_delete)} items that weren't found in any category")
            
            # Filter out deleted items from new_items list
            filtered_items = [item for item in new_items if item.item_id not in items_to_delete]
        else:
            filtered_items = new_items

        # Update database first
        updates = []
        for item_id, categories in item_categories.items():
            updates.append(
                Items.find_one(
                    Items.item_id == item_id
                ).update({
                    "$set": {"categories": list(categories)}
                })
            )
        
        if updates:
            await asyncio.gather(*updates)
            print(f"Updated categories for {len(updates)} items")
                
            for item in filtered_items:
                if item.item_id in item_categories:
                    item.categories = list(item_categories[item.item_id])
        
        return filtered_items

    async def create_and_process_canonical_items(self, new_items: List[Items]):
        """Create and process canonical items for new items only"""
        print("Creating and processing canonical items...")
        
        # Get all canonical categories for reference
        canonical_categories = await CanonicalCategory.find_all().to_list()
        
        # Process each new item
        canonical_items_to_create = []
        for item in new_items:
            # Skip if canonical item already exists or if item has null/empty price or name
            if (await CanonicalItem.find_one({"item_id": item.item_id}) or
                not item.price or item.price == "" or
                not item.name or item.name == ""):
                continue
                
            # Text normalization
            name = ftfy.fix_text(item.name.lower())
            name = name.split("|")[0]  # Remove French text
            name = re.sub(r'[^a-zA-Z0-9,.\s\-/]', '', name)
            
            # Keyword replacements
            for old, new in name_replacements.items():
                name = name.replace(old, new)
            
            # Parse pricing
            item_price = item.price.lower() if item.price else ""
            if item.pre_price_text:
                item_price = f"{item.pre_price_text.lower()} {item_price}"
            if item.price_text:
                item_price = f"{item_price} {item.price_text.lower()}"
            
            for old, new in price_replacements.items():
                item_price = item_price.replace(old, new)
            
            # Extract price value
            price = 100000  # Default high price
            deal = re.search(r"(\d+)\s?(?:/|for)\s\$(\d+\.\d\d)", item_price)
            if deal:
                price = float(deal.group(2)) / float(deal.group(1))
            else:
                p = re.search(r"([0-9]+\.[0-9][0-9])", item_price)
                if not re.search(r"lb", item_price) and p:
                    price = float(p.group(1))
            
            # Extract unit
            units = ['g', 'kg', 'lb', 'oz', 'ml', 'l'] + [u + 's' for u in ['g', 'kg', 'lb', 'oz', 'ml', 'l']]
            match = re.search(r"(\d+(\.|\-|/|\d)*)\s?({})(?![a-zA-Z])".format("|".join(units)), name)
            unit = match.group(0) if match else None
            
            # Handle splits and create canonical items
            split_names = parse_items_from_multiple_names(name)
            
            # Get potential categories based on item's categories
            relevant_categories = [
                c for c in canonical_categories 
                if any(cat in item.categories for cat in c.categories)
            ]
            
            if len(split_names) > 1:
                # Handle split items
                for split_name in split_names:
                    closest_matches = sorted([
                        (c, similarity(split_name, c.name))
                        for c in relevant_categories
                    ], key=lambda x: x[1], reverse=True)
                    
                    if closest_matches and closest_matches[0][1] > 0.8:
                        canonical_items_to_create.append(
                            CanonicalItem(
                                item_id=item.item_id,
                                flyer_id=item.flyer_id,
                                name=split_name,
                                price=price,
                                unit=unit,
                                canonical_category=closest_matches[0][0].name
                            )
                        )
            else:
                # Handle single items
                closest_matches = sorted([
                    (c, similarity(name, c.name))
                    for c in relevant_categories
                ], key=lambda x: x[1], reverse=True)
                
                category_name = closest_matches[0][0].name if closest_matches and closest_matches[0][1] > 0.8 else None
                
                canonical_items_to_create.append(
                    CanonicalItem(
                        item_id=item.item_id,
                        flyer_id=item.flyer_id,
                        name=name,
                        price=price,
                        unit=unit,
                        canonical_category=category_name
                    )
                )
        
        # Bulk insert new canonical items
        if canonical_items_to_create:
            await CanonicalItem.insert_many(canonical_items_to_create)
            print(f"Created {len(canonical_items_to_create)} new canonical items")

    async def create_canonical_items(self, new_items: List[Items]):
        """Create canonical items for new items"""
        print("Creating canonical items...")
        
        # Convert Items to dict format for processing
        items = []
        for item in new_items:
            # Skip if canonical item already exists
            if await CanonicalItem.find_one({"item_id": item.item_id}):
                continue
            
            items.append({
                "item_id": item.item_id,
                "flyer_id": item.flyer_id,
                "name": item.name,
                "categories": item.categories,
                "item_details": {
                    "price": item.price,
                    "pre_price_text": item.pre_price_text,
                    "price_text": item.price_text
                }
            })

        # Process items in batches
        for item in items:
            # Text normalization
            item['name'] = ftfy.fix_text(item['name'].lower())
            item['name'] = item['name'].split("|")[0]  # Remove French text
            item['name'] = re.sub(r'[^a-zA-Z0-9,.\s\-/]', '', item['name'])
            
            # Keyword replacements
            for old, new in name_replacements.items():
                item['name'] = item['name'].replace(old, new)
            
            # Parse pricing
            item_price = item['item_details']['price'].lower() if item['item_details']['price'] else ""
            if item["item_details"]["pre_price_text"]:
                item_price = f"{item['item_details']['pre_price_text'].lower()} {item_price}"
            if item["item_details"]["price_text"]:
                item_price = f"{item_price} {item['item_details']['price_text'].lower()}"
            
            for old, new in price_replacements.items():
                item_price = item_price.replace(old, new)
            
            # Extract price value
            deal = re.search(r"(\d+)\s?(?:/|for)\s\$(\d+\.\d\d)", item_price)
            if deal:
                item['price'] = float(deal.group(2)) / float(deal.group(1))
            else:
                p = re.search(r"([0-9]+\.[0-9][0-9])", item_price)
                if re.search(r"lb", item_price):
                    item['price'] = 100000
                elif p:
                    item['price'] = float(p.group(1))
                else:
                    item['price'] = 100000
            
            # Extract unit
            units = ['g', 'kg', 'lb', 'oz', 'ml', 'l'] + [u + 's' for u in ['g', 'kg', 'lb', 'oz', 'ml', 'l']]
            match = re.search(r"(\d+(\.|\-|/|\d)*)\s?({})(?![a-zA-Z])".format("|".join(units)), item['name'])
            item['unit'] = match.group(0) if match else None

        # Handle splits and create canonical items
        canonical_items_to_create = []
        for item in items:
            split_names = parse_items_from_multiple_names(item['name'])
            
            # Get potential categories based on item's categories
            categories = []
            if 'categories' in item and item['categories']:
                categories = await CanonicalCategory.find(
                    {"name": {"$in": item['categories']}
                }).to_list()
            
            if len(split_names) > 1:
                # Handle split items
                for split_name in split_names:
                    closest_matches = sorted([
                        (c, similarity(split_name, c.name))
                        for c in categories
                    ], key=lambda x: x[1], reverse=True)
                    
                    if closest_matches and closest_matches[0][1] > 0.8:
                        category = closest_matches[0][0]
                        canonical_items_to_create.append(
                            CanonicalItem(
                                item_id=item['item_id'],
                                flyer_id=item['flyer_id'],
                                name=split_name,
                                price=item['price'],
                                unit=item['unit'],
                                canonical_category=category.name
                            )
                        )
            else:
                # Handle single items
                closest_matches = sorted([
                    (c, similarity(item['name'], c.name))
                    for c in categories
                ], key=lambda x: x[1], reverse=True)
                
                category_name = closest_matches[0][0].name if closest_matches and closest_matches[0][1] > 0.8 else None
                
                canonical_items_to_create.append(
                    CanonicalItem(
                        item_id=item['item_id'],
                        flyer_id=item['flyer_id'],
                        name=item['name'],
                        price=item['price'],
                        unit=item['unit'],
                        canonical_category=category_name
                    )
                )
        
        # Bulk insert canonical items
        if canonical_items_to_create:
            await CanonicalItem.insert_many(canonical_items_to_create)
            print(f"Created {len(canonical_items_to_create)} canonical items")

    async def run_async(self):
        """Run the nightly scraper asynchronously"""
        print("Starting nightly scrape...")
        return
        start_time = datetime.now()
        
        # 1. Get new flyers
        await self.scrape_new_flyers_async()
        
        # 2. Get items from flyers
        all_new_items = []
        items = await self.process_flyer_items("M1P1J1")
        all_new_items.extend(items)
        
        if not all_new_items:
            print("No new items found. Ending scrape.")
            return
        
        # 3. Fetch categories for only the new items and get filtered list
        filtered_items = await self.fetch_category_items(
            [item.item_id for item in all_new_items],
            all_new_items
        )
        
        # 4. Create canonical items with filtered list
        await self.create_and_process_canonical_items(filtered_items)

        # Print timing and stats
        end_time = datetime.now()
        duration = end_time - start_time
        print(f"\nScrape completed in {duration}")
        print(f"Total new items added: {len(all_new_items)}")
        print(f"Total filtered items processed: {len(filtered_items)}")

    def run(self):
        """Run the nightly scraper"""
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.run_async())

if __name__ == "__main__":
    scraper = NightlyScraper()
    scraper.run()
