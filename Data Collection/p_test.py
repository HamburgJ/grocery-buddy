import asyncio
from flipp_api.db import init_db
from collections import defaultdict
from flipp_api.models import ItemCategorizations, Items

async def count_item_categories():
    # Dictionary to store item_id and count of categories it's in
    item_category_count = defaultdict(int)
    
    # Fetch all item categorizations from the database
    categorizations = await ItemCategorizations.find_all().to_list()
    
    # Count the number of categorizations each item has
    for categorization in categorizations:
        item_category_count[categorization.item_id] += 1
    
    # Output results
    print("Item ID | Category Count")
    for item_id, count in item_category_count.items():
        print(f"{item_id}    | {count}")

    # Find items that aren't in any category (optional check)
    all_item_ids = {item.item_id for item in await Items.find_all().to_list()}
    categorized_item_ids = set(item_category_count.keys())
    uncategorized_item_ids = all_item_ids - categorized_item_ids
    


async def main():

    await init_db()
    await count_item_categories()

# Run the analysis
if __name__ == "__main__":
    asyncio.run(main())
