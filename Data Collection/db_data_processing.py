
from flipp_api.models import Merchants, Scrapers, Flyers, Items, Categories, ItemCategorizations, CanonicalCategory, CanonicalItem
from flipp_api.db import init_db
import nltk
from db_updater import DBUpdater
import asyncio
from nltk.stem import WordNetLemmatizer
import re
import ftfy
from constants import *
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

# Ensure the WordNet data is downloaded for lemmatization
nltk.download('wordnet')
nltk.download('omw-1.4')

# uses the raw data scraped from flipp to create canonical data, items and categories

# categories
# constant, are hand chosen and imported from file

# items
# normailze all items
# 

CATEGORY_RANK_CUTOFF = 100


class CUpdater:
    def __init__(self):
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        loop.run_until_complete(init_db())

    async def create_canonical_categories_async(self):
        
        # Pipeline to get top categories (top 100 per base category based on priority rank)
        
        specific_base_categories = [
            "dairy_eggs",
            "bakery",
            "pantry",
            "deli",
            "produce",
            "meat_seafood",
            "frozen",
            "beverages",
        ]
        top_categories_pipeline = [
            {
                "$match": {
                    "canonical_category": {"$in": specific_base_categories}  # Filter to specific base categories, if provided
                }
            },
            {
                "$setWindowFields": {
                    "partitionBy": "$canonical_category",
                    "sortBy": {"priority_rank": -1},
                    "output": {
                        "rank": {"$rank": {}}
                    }
                }
            },
            {
                "$match": {
                    "rank": {"$lte": CATEGORY_RANK_CUTOFF}  # Limits to the top 100 per base category
                }
            },
            {
                "$sort": {
                    "base_category": 1,
                    "rank": 1
                }
            }
        ]

        bottom_categories_pipeline = [
            {
                "$match": {
                    "canonical_category": {"$in": specific_base_categories}  # Filter to specific base categories, if provided
                }
            },
            {
                "$setWindowFields": {
                    "partitionBy": "$canonical_category",
                    "sortBy": {"priority_rank": -1},
                    "output": {
                        "rank": {"$rank": {}}
                    }
                }
            },
            {
                "$match": {
                    "rank": {"$gt": CATEGORY_RANK_CUTOFF}  # Limits to the top 100 per base category
                }
            },
            {
                "$sort": {
                    "base_category": 1,
                    "rank": 1
                }
            }
        ]
        
        top_categories = await Categories.aggregate(top_categories_pipeline).to_list()
        print(f"Found {len(top_categories)} top categories")
        # Initialize WordNet lemmatizer for comparison
        lemmatizer = WordNetLemmatizer()
        lemma_to_categories = {}

        for category in top_categories:
            original_name = category['name']
            # Remove all non-letter characters and convert to lowercase
            cleaned_name = re.sub(r'[^a-zA-Z]', '', original_name.lower())
            lemmatized_name = lemmatizer.lemmatize(cleaned_name)
            canonical_category = category['canonical_category']
            key = f"{lemmatized_name}_{canonical_category}"
            if key not in lemma_to_categories:
                lemma_to_categories[key] = [category]
            else:
                print(f"Combining {category['name']} with {lemma_to_categories[key][0]['name']}")
                lemma_to_categories[key].append(category)

        # now that the top categories have been created, query the rest of the raw categories to try and find more matches, but do not create new keys in the dictionary
        # if a key already exists
        raw_categories = await Categories.aggregate(bottom_categories_pipeline).to_list()
        found = 0
        for category in raw_categories:
            original_name = category['name']
            cleaned_name = re.sub(r'[^a-zA-Z]', '', original_name.lower())
            lemmatized_name = lemmatizer.lemmatize(cleaned_name)
            canonical_category = category['canonical_category']
            key = f"{lemmatized_name}_{canonical_category}"
            if key in lemma_to_categories:
                print(f"Combining {category['name']} with {lemma_to_categories[key][0]['name']}")
                lemma_to_categories[key].append(category)
                found += 1

        print(f"Found {found} additional categories")

        lemma_to_longest_name_category = {
            key: max(categories, key=lambda c: len(c['name']))
            for key, categories in lemma_to_categories.items()
        }

        print(f"Combined {len(top_categories) - len(lemma_to_longest_name_category)} categories, leaving {len(lemma_to_longest_name_category)} categories")

        # Create canonical categories based on the longest names selected
        canonical_categories = [
            CanonicalCategory(
                name=lemma_to_longest_name_category[key]['name'],
                original_categories=[
                    c['canonical_category'] for c in categories
                ],
                cat=lemma_to_longest_name_category[key]['cat'],
                base_category=lemma_to_longest_name_category[key]['canonical_category'],
                priority_rank=lemma_to_longest_name_category[key]['priority_rank'],
                interest=max(c['priority_rank'] for c in categories),
                categories=[
                    c['name'] for c in categories
                ]
            )
            for key, categories in lemma_to_categories.items()
        ]
        
        # Clear and insert all canonical categories into the database
        await CanonicalCategory.delete_all()
        await CanonicalCategory.insert_many(canonical_categories)
        print("Inserted all canonical categories")
        
    def create_canonical_categories(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.create_canonical_categories_async())

    async def create_canonical_items_async(self):
        '''
        _id: ObjectId item_id: int flyer_id: int value: float size: Optional[str] = None unit: Optional[str] = None
        for now, let's just do a query which takes all categories in the 'categories' field of the canonicalcategory document, then take all items (so like a double join), then, without duplicates, have each one of these item become a canonicalitem
        '''

        # steps
        # 1. perform double join, where the base is canonicalcategory, which contains a list of categories, which each contain a list of items
        # 2. for each item, create a canonicalitem object, without duplicates
        # 3. update canonicalcategory's 'item' list field with the item_ids
        # Step 1: Perform double join to get all items associated with canonical categories
        pipeline = [
            {
                "$lookup": {
                    "from": "Categories",
                    "localField": "categories",
                    "foreignField": "name",
                    "as": "category_docs"
                }
            },
            {
                "$unwind": "$category_docs"
            },
            {
                "$lookup": {
                    "from": "Items",
                    "localField": "category_docs.items",
                    "foreignField": "item_id",
                    "as": "item_docs"
                }
            },
            {
                "$unwind": "$item_docs"
            },
            {
                "$group": {
                    "_id": "$item_docs.item_id",
                    "item": {"$first": "$item_docs"},
                    "categories": {"$addToSet": "$category_docs.name"}
                }
            }
        ]

        # Step 2: Create canonical items and build category-item mapping
        raw_items = await CanonicalCategory.aggregate(pipeline).to_list()
        canonical_items = [
            CanonicalItem(
                item_id=item['item']['item_id'],
                flyer_id=item['item']['flyer_id']
            )
            for item in raw_items
        ]

        print(f"Found {len(canonical_items)} canonical items")

        # Step 3: Clear and insert all canonical items
        await CanonicalItem.delete_all()
        await CanonicalItem.insert_many(canonical_items)
        print("Inserted all canonical items")

        # Step 4: Create a mapping of category names to item IDs
        category_items_map = {}
        for item in raw_items:
            for category in item['categories']:
                if category not in category_items_map:
                    category_items_map[category] = []
                category_items_map[category].append(item['_id'])

        # Step 5: Update each CanonicalCategory with its items
        # First, get all categories
        categories = await CanonicalCategory.find_all().to_list()

        # Update each category's items field
        for category in categories:
            if category.name in category_items_map:
                category.items = category_items_map[category.name]
                await category.save()  # Assuming there's a save method, adjust based on your model

        print("Updated all categories with their items")

    def create_canonical_items(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.create_canonical_items_async())

    async def process_canonical_items_async(self):

        # Step 0: delete all canonical items which have a null price
        print("Deleting all canonical items with a null price...")
        initial_count = await CanonicalItem.count()
        
        pipeline = [
                {
                    "$lookup": {
                        "from": "Items",
                        "localField": "item_id",
                        "foreignField": "item_id",
                        "as": "item_details"
                    }
                },
                {
                    "$unwind": {
                        "path": "$item_details",
                        "preserveNullAndEmptyArrays": False
                    }
                }
            ]
        # Execute the aggregation pipeline
        items = await CanonicalItem.aggregate(
            pipeline
        ).to_list()
        # delete all items with a null price
        items_to_delete = [item['_id'] for item in items if item['item_details']['price'] is None or item['item_details']['price'] == "" or
                            item['item_details']['name'] is None or item['item_details']['name'] == ""]
        await CanonicalItem.find(
            {"_id": {"$in": items_to_delete}}
        ).delete()
        items = await CanonicalItem.aggregate(
            pipeline
        ).to_list()

        # Get final count to calculate how many were deleted
        final_count = await CanonicalItem.count()
        print(f"Deleted {initial_count - final_count} canonical items with a null price.")
            
        # Step 1: Data processing
        print("Starting data processing for canonical items...")
        for item in items:
            # Fix text and normalize
            item['name'] = ftfy.fix_text(item['item_details']['name'].lower())
            # remove french, if text is in form of x|y, remove y
            item['name'] = item['name'].split("|")[0]
            # remove all non-alphanumeric characters
            item['name'] = re.sub(r'[^a-zA-Z0-9,.\s\-/]', '', item['name'])
            
        print(f"Processed {len(items)} items for text normalization.")

        # Step 2: Keyword replacements
        print("Performing keyword replacements...")
        for item in items:
            for old, new in name_replacements.items():
                item['name'] = item['name'].replace(old, new)
        print("Keyword replacements completed.")

        # Step 4: Parsing for pricing
        print("Parsing pricing information...")
        for item in items:
            # create item price by concatenating all price fields
            item_price = item['item_details']['price'].lower()

            if item["item_details"]["pre_price_text"]:
                item_price = item["item_details"]["pre_price_text"].lower() + " " + item_price
            
            if item["item_details"]["price_text"]:
                item_price = item_price + " " + item["item_details"]["price_text"].lower()

            for old, new in price_replacements.items():
                item_price = item_price.replace(old, new)
            
            
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
                    item['price'] = 10000000000


            # Step 5: Determine units for pricing and convert to standard units using regex
            units = ['g', 'kg', 'lb', 'oz', 'ml', 'l']
            plural_units = []
            for unit in units:
                plural_units.append(unit + "s")
            units += plural_units

            # instead of just searching for the unit substring, we will check for a number followed by a unit,
            # optionally with a dash or period allowed in the number

            # use .join to create a regex pattern for the units
            match = re.search(r"(\d+(\.|\-|/|\d)*)\s?({})(?![a-zA-Z])".format("|".join(units)), item['name'])
            if match:
                item['unit'] = match.group(0)
            else:
                item['unit'] = None
        print("Pricing parsing completed.")

        # Step 6: split items which are multiple canonical items
        # This is done by searching for patterns with regex, e.g. x or y, x,y, z, x, y, and z, etc
        # the rule is this: , and or are interchangable, as well as ands. between each are the boundaries for a new split, with the names being split and all other
        # fields being copied
        print("Splitting items with multiple canonical items...")
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
        
        # splitting code:
        # If there is only one item in the split, we do not do anything
        # If there are multiple split results, then for the item, we will find all the instances of that item_id inside of a canonicalcategory's items field
        # The number of times the item appears in the items field is not nessisarily equal to the number of splits
        # We will compare how similar each name is to the name of each cononicalitem, then for
        # each of the highest matches, we will create a new canonicalitem with the split name and the canonicalcategory
        # The price and unit will be copied from the original item
        for item in items:
            split_names = parse_items_from_multiple_names(item['name'])
            if len(split_names) > 1:
                # Find all instances of the original item_id in the canonicalcategory's items field
                categories = await CanonicalCategory.find({"items": item['item_id']}).to_list()
                for split_name in split_names:
                    # Compare the similarity of the split name to each canonicalitem name
                    # Find the closest match(es) and create new canonicalitem(s) with the split name and the associated category
                    closest_matches = sorted([
                        (c, similarity(split_name, c.name))
                        for c in categories
                    ], key=lambda x: x[1], reverse=True)
                    
                    for category, similarity_score in closest_matches:
                        if similarity_score > 0.8:  # Adjust the threshold as needed
                            new_item = CanonicalItem(
                                item_id=item['item_id'],
                                flyer_id=item['flyer_id'],
                                name=split_name,
                                price=item['price'],
                                unit=item['unit'],
                                canonical_category=category.name
                            )
                            await new_item.save()
                            print(f"Split'{split_name}' from {split_names} into new canonical item with category '{category.name}' and similarity score {similarity_score:.2f}")

            else:
                # no split, but we still need to match to a category
                categories = await CanonicalCategory.find({"items": item['item_id']}).to_list()
                closest_matches = sorted([
                    (c, similarity(item['name'], c.name))
                    for c in categories
                ], key=lambda x: x[1], reverse=True)

                # set canonical category to the closest match
                if closest_matches:
                    item['canonical_category'] = closest_matches[0][0].name
                else:
                    item['canonical_category'] = None
                             

        for item in items:
            item.pop('item_details', None)
            await CanonicalItem.find_one({"item_id": item['item_id']}).update({"$set": item})
        print("All processed items have been saved.")
    
    def process_canonical_items(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.process_canonical_items_async())

if __name__ == "__main__":
    # delete all canonical categories and items
    cu = CUpdater()

    #cu.create_canonical_categories()
    cu.create_canonical_items()
    cu.process_canonical_items()
    