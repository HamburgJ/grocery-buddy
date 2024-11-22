import asyncio
from flipp_api.models import Merchants, Scrapers, Flyers, Items, Categories, ItemCategorizations, CanonicalItem, CanonicalCategory
from flipp_api.db import init_db
from flipp_api.backflipp import *
from datetime import datetime
import ftfy
import re
import nltk
from db_updater import DBUpdater
from nltk.stem import WordNetLemmatizer
from text.text_constants import *
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.spatial.distance import cosine
from price_parser import parse_value


def similarity(text, category):
    """
    Calculate the cosine similarity between two text strings.
    First checks against exclusion rules.
    """
    # Check exclusions first
    category_lower = category.lower()
    text_lower = text.lower()
    
    if CATEGORY_EXCLUSIONS.get(category_lower):
        for exclusion in CATEGORY_EXCLUSIONS.get(category_lower):
            if exclusion in text_lower:
                return -1

    # If no exclusions match, proceed with normal similarity calculation
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform([category, text])
    v1 = X[0].toarray().flatten()
    v2 = X[1].toarray().flatten()
    return 0.5 + 0.5 * cosine(v1, v2)


def find_matches(
    text1, 
    categories, 
    threshold=0.5
):
    text1 = text1.lower()
    matches = []
    
    for category in categories:
        category = category.lower()
        
        # If one string contains the other entirely
        if category in text1 or text1 in category:
            score = min(len(text1), len(category)) / len(category)
            if score >= threshold:
                matches.append((category, score))
            continue
            
        # Find longest common substring
        max_length = 0
        for i in range(len(text1)):
            for j in range(len(category)):
                k = 0
                while (i + k < len(text1) and 
                       j + k < len(category) and 
                       text1[i + k] == category[j + k]):
                    k += 1
                max_length = max(max_length, k)
        
        score = max_length / len(category)
        if score >= threshold:
            matches.append((category, score))
    
    return sorted(matches, key=lambda x: x[1], reverse=True)


def process_split_names(names):
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
postal_codes = ['N2G4G7', 'M5R2E3', 'N2L3G1', 'K7L3N6']

class NightlyScraper:
    def __init__(self):
        self.debug = False  # Add debug flag
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
            all_new_flyer_ids = set()
            for flyer in await Flyers.find({"merchant_id": merchant.merchant_id}).to_list():
                all_new_flyer_ids.add(flyer.flyer_id)
            
            # Get current flyers for this merchant's postal codes
            for postal_code in postal_codes:
                flyer_ids = get_merchant_flyer_ids(merchant.name_identifier, postal_code)
                
                # Filter to only new flyers that aren't already in DB or current batch
                new_flyer_ids = [
                    fid for fid in flyer_ids 
                    if fid not in all_new_flyer_ids
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
                all_new_flyer_ids.update(new_flyer_ids)

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

    async def process_flyer_items(self, postal_code):
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
        
        # Create a dictionary to track unique items across all flyers
        # Key: (merchant_id, name, price)
        unique_items_dict = {}
        
        for flyer_data in flyer_results:
            existing_item_ids = {item['item_id'] for item in flyer_data['existing_items']}
            
            # Get items from flyer API
            items = get_flyer_items(flyer_data['flyer_id'], postal_code)
            
            for item in items:
                # Skip non-broccoli items in debug mode
                if self.debug and 'broccoli' not in item.get('name', '').lower():
                    continue
                    
                if item['id'] in existing_item_ids:
                    continue
                    
                # Create unique key based on merchant, name, and price
                key = (
                    flyer_data['merchant_id'],
                    item.get('name', '').lower().strip(),
                    item.get('price', '')
                )
                
                # Only keep the first occurrence of a duplicate item
                if key not in unique_items_dict:
                    unique_items_dict[key] = Items(
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
        
        # Convert unique items dictionary to list
        new_items = list(unique_items_dict.values())
        
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
        
        # Mark all flyers as scraped
        for flyer_data in flyer_results:
            await Flyers.find_one({"_id": flyer_data['_id']}).update({"$set": {"scraped": True}})

        return all_new_items

    async def fetch_category_items(self, new_item_ids):
        """Fetch category items only for new items found in this scrape"""
        print("Fetching category items...")
        
        # Get all canonical categories
        canonical_categories = await CanonicalCategory.find_all().to_list()
        
        # Get all new items with their flyer postal codes
        items = await Items.find({"item_id": {"$in": new_item_ids}}).to_list()
        flyer_ids = {item.flyer_id for item in items}
        flyers = await Flyers.find({"flyer_id": {"$in": list(flyer_ids)}}).to_list()
        flyer_postal_codes = {flyer.flyer_id: flyer.postal_code for flyer in flyers}
        
        # Track item->categories mapping
        item_categories = {}
        
        # For each canonical category, fetch items and update the category
        for canonical_category in canonical_categories:
            if not canonical_category.categories:
                continue
            
            # Skip non-broccoli categories in debug mode
            if self.debug and not any('broccoli' in cat.lower() for cat in canonical_category.categories):
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
            filtered_items = [item for item in new_item_ids if item not in items_to_delete]
        else:
            filtered_items = new_item_ids

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
                
            for item_id in filtered_items:
                if item_id in item_categories:
                    item_categories[item_id] = list(item_categories[item_id])
        
        return filtered_items

    async def create_and_process_canonical_items(self, items):
        """Create and process canonical items for new items only"""
        print("Creating and processing canonical items...")
        
        # Get all canonical categories for reference
        canonical_categories = await CanonicalCategory.find_all().to_list()
                
        def check_exclusions(text, category):
            """Check if any exclusions apply to this text-category pair"""
            category_lower = category.lower()
            text_lower = text.lower()
            
            if CATEGORY_EXCLUSIONS.get(category_lower):
                for exclusion in CATEGORY_EXCLUSIONS.get(category_lower):
                    if exclusion in text_lower:
                        return True
            return False

        def get_category_matches(
            text, 
            canonical_categories, 
            full_name=""
        ):
            """Get valid category matches for a text, considering exclusions"""
            # First check if any exclusions apply to the full item name
            excluded_categories = {
                cat.name for cat in canonical_categories 
                if any(check_exclusions(full_name, c) for c in cat.categories)
            }
            
            matches = []
            for category in canonical_categories:
                if category.name in excluded_categories:
                    continue
                    
                # Get matches against all category terms
                all_matches = []
                for cat_term in category.categories:
                    if check_exclusions(text, cat_term):
                        continue
                    term_matches = find_matches(text, [cat_term])
                    if term_matches:
                        all_matches.extend(term_matches)
                
                # If we found any matches, keep the best score
                if all_matches:
                    best_match = max(all_matches, key=lambda x: x[1])
                    matches.append((category, best_match[1]))
            
            return [m for m in matches if m[1] >= 0.5]

        canonical_items_to_create = []
        for item in items:
            # Skip if canonical item already exists or if item has null/empty price or name
            if (await CanonicalItem.find_one({"item_id": item.item_id}) or
                not item.price or item.price == "" or
                not item.name or item.name == ""):
                continue
            
            # Text normalization
            name = ftfy.fix_text(item.name.lower())
            name = name.split("|")[0]  # Remove French text
            name = re.sub(r'[^a-zA-Z0-9,.\s\-/]', '', name)
            
            # Parse pricing
            price, unit, quantity, is_multi = parse_value(item.pre_price_text, item.price, item.price_text)

            # Get potential categories based on item's categories
            relevant_categories = [
                c for c in canonical_categories 
                if any(cat in item.categories for cat in c.categories)
            ]
            
            # Handle splits and create canonical items
            split_names = process_split_names(name)
            
            if len(split_names) > 1:
                # Process multi-item entries
                split_matches = {}  # Store all matches for each split
                used_categories = set()  # Track assigned categories
                
                # First, get all potential matches for each split
                for split_name in split_names:
                    valid_matches = get_category_matches(
                        split_name, 
                        relevant_categories,
                        full_name=name
                    )
                    split_matches[split_name] = sorted(valid_matches, key=lambda x: x[1], reverse=True)
                
                # Assign categories greedily based on best matches
                while split_matches:
                    best_score = -1
                    best_split = None
                    best_category = None
                    
                    # Find the best remaining match across all splits
                    for split_name, matches in split_matches.items():
                        # Filter out already used categories
                        available_matches = [m for m in matches if m[0].name not in used_categories]
                        if available_matches:
                            score = available_matches[0][1]
                            if score > best_score:
                                best_score = score
                                best_split = split_name
                                best_category = available_matches[0][0]
                    
                    if best_split is None:
                        break
                        
                    # Create canonical item for best match
                    canonical_items_to_create.append(
                        CanonicalItem(
                            item_id=item.item_id,
                            flyer_id=item.flyer_id,
                            name=best_split,
                            price=price,
                            unit=unit,
                            canonical_category=best_category.name
                        )
                    )
                    
                    # Mark category as used and remove processed split
                    used_categories.add(best_category.name)
                    del split_matches[best_split]
            else:
                # Process single-item entries
                valid_matches = get_category_matches(
                    name, 
                    relevant_categories,
                    full_name=name
                )
                
                for category, score in valid_matches:
                    canonical_items_to_create.append(
                        CanonicalItem(
                            item_id=item.item_id,
                            flyer_id=item.flyer_id,
                            name=name,
                            price=price,
                            unit=unit,
                            canonical_category=category.name
                        )
                    )
        
        # Bulk create all canonical items
        if canonical_items_to_create:
            await CanonicalItem.insert_many(canonical_items_to_create)
            print(f"Created {len(canonical_items_to_create)} canonical items")

    async def deduplicate_canonical_items(self, new_item_ids):
        """
        Remove duplicate canonical items where name, price, and merchant are identical.
        Only considers items that were just created in this scrape run.
        """
        print("Deduplicating canonical items...")
        
        # Get only the canonical items created in this run
        pipeline = [
            {
                "$match": {
                    "item_id": {"$in": new_item_ids}
                }
            },
            {
                "$lookup": {
                    "from": "Items",
                    "localField": "item_id",
                    "foreignField": "item_id",
                    "as": "item"
                }
            },
            {
                "$unwind": "$item"
            }
        ]
        
        canonical_items = await CanonicalItem.aggregate(pipeline).to_list()
        
        # Group by name, price, and merchant_id
        duplicates = {}
        for item in canonical_items:
            key = (
                item['name'].lower().strip(),
                item['price'],
                item['item']['merchant_id']
            )
            if key not in duplicates:
                duplicates[key] = []
            duplicates[key].append(item)
        
        # Find and delete duplicates
        items_to_delete = []
        for key, items in duplicates.items():
            if len(items) > 1:
                # Keep the first one, delete the rest
                items_to_delete.extend([item['_id'] for item in items[1:]])
        
        if items_to_delete:
            await CanonicalItem.find({"_id": {"$in": items_to_delete}}).delete()
            print(f"Deleted {len(items_to_delete)} duplicate canonical items")

    async def run_async(self):
        """Run the nightly scraper asynchronously"""
        print("Starting nightly scrape...")
        print(f"Debug mode: {self.debug}")
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
        
        # 3. Fetch categories for only the new items and get filtered item IDs
        filtered_item_ids = await self.fetch_category_items(
            [item.item_id for item in all_new_items]
        )
        
        # 4. Get the full Item objects for the filtered IDs
        filtered_items = await Items.find(
            {"item_id": {"$in": filtered_item_ids}}
        ).to_list()
        
        # 5. Create canonical items with filtered items
        await self.create_and_process_canonical_items(filtered_items)
        
        # 6. Deduplicate canonical items
        await self.deduplicate_canonical_items(filtered_item_ids)
        
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
