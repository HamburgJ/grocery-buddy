from datetime import datetime
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
from pydantic import BaseModel
from typing import Optional, List
import argparse
import os

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI', "mongodb://localhost:27017")
DB_NAME = "grocery_buddy"

class Items(BaseModel):
    item_id: int
    flyer_id: int
    merchant_id: int
    name: str
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None

class CanonicalItem(BaseModel):
    item_id: int
    flyer_id: int
    canonical_category: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    value: Optional[float] = None
    size: Optional[str] = None
    unit: Optional[str] = None

async def cleanup_expired_items(safe_mode: bool = True):
    """
    Clean up expired items and their associated canonical items.
    
    Args:
        safe_mode (bool): If True, only shows what would be deleted without actually deleting
    """
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Get current counts
    total_items = await db.Items.count_documents({})
    total_canonical = await db.CanonicalItem.count_documents({})
    
    print(f"\nCurrent database state:")
    print(f"Total Items: {total_items}")
    print(f"Total CanonicalItems: {total_canonical}")
    
    # Find expired items
    current_date = datetime.now()
    
    # First, let's check the date format in the database
    sample_item = await db.Items.find_one({"valid_to": {"$exists": True}})
    if sample_item:
        print(f"\nSample valid_to date format: {sample_item.get('valid_to')}")
    
    # Query for expired items, handling both string and date formats
    expired_query = {
        "$or": [
            # Handle ISO format strings
            {"valid_to": {"$lt": current_date.isoformat()}},
            # Handle native MongoDB dates
            {"valid_to": {"$lt": current_date}},
            # Handle string dates in YYYY-MM-DD format
            {"valid_to": {"$lt": current_date.strftime("%Y-%m-%d")}}
        ]
    }
    
    expired_items = await db.Items.find(expired_query).to_list(length=None)
    
    if not expired_items:
        print("\nDebug: No expired items found. Checking date fields...")
        # Check items with valid_to field
        items_with_dates = await db.Items.find(
            {"valid_to": {"$exists": True}},
            {"valid_to": 1, "_id": 0}
        ).limit(5).to_list(length=None)
        print(f"Sample valid_to dates in database: {items_with_dates}")
    
    expired_item_ids = [item["item_id"] for item in expired_items]
    
    # Find canonical items linked to expired items
    affected_canonical = await db.CanonicalItem.find(
        {"item_id": {"$in": expired_item_ids}}
    ).to_list(length=None)
    
    print(f"\nFound:")
    print(f"- {len(expired_items)} expired items")
    print(f"- {len(affected_canonical)} associated canonical items")
    
    if safe_mode:
        print("\nSAFE MODE: No deletions performed")
        print("Would delete:")
        print(f"- {len(expired_items)} items")
        print(f"- {len(affected_canonical)} canonical items")
        print(f"\nWould remain after deletion:")
        print(f"- {total_items - len(expired_items)} items")
        print(f"- {total_canonical - len(affected_canonical)} canonical items")
    else:
        # Delete expired items and their canonical items
        if expired_items:
            result = await db.Items.delete_many(expired_query)
            print(f"\nDeleted {result.deleted_count} expired items")
            
            if affected_canonical:
                result = await db.CanonicalItem.delete_many(
                    {"item_id": {"$in": expired_item_ids}}
                )
                print(f"Deleted {result.deleted_count} associated canonical items")
        
        # Show remaining counts
        remaining_items = await db.Items.count_documents({})
        remaining_canonical = await db.CanonicalItem.count_documents({})
        print(f"\nRemaining after deletion:")
        print(f"- {remaining_items} items")
        print(f"- {remaining_canonical} canonical items")
    
    client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up expired items from the database")
    parser.add_argument(
        "--safe",
        action="store_true",
        default=True,
        help="Run in safe mode (only show what would be deleted)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Actually perform the deletions"
    )
    
    args = parser.parse_args()
    
    # If --force is specified, override safe mode
    safe_mode = not args.force
    
    asyncio.run(cleanup_expired_items(safe_mode=safe_mode)) 