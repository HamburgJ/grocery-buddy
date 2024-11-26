import asyncio
from datetime import datetime, timezone
from flipp_api.models import Flyers, Items, CanonicalItem
from flipp_api.db import init_db

class DataDeleter:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(init_db())

    def parse_date(self, date_value):
        if isinstance(date_value, datetime):
            return date_value
        if isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            except ValueError:
                return None
        return None

    async def delete_future_data(self):
        # Make cutoff_date timezone-aware using UTC
        cutoff_date = datetime(2024, 11, 1, tzinfo=timezone.utc)
        
        # Process Flyers
        all_flyers = await Flyers.find_all().to_list()
        to_delete_flyers = []
        keep_flyers = []
        
        for flyer in all_flyers:
            available_from = self.parse_date(flyer.available_from)
            if available_from:
                # Convert available_from to UTC for comparison
                available_from = available_from.astimezone(timezone.utc)
                if available_from >= cutoff_date:
                    to_delete_flyers.append(flyer)
                else:
                    keep_flyers.append(flyer)
            else:
                keep_flyers.append(flyer)

        # Process Items
        all_items = await Items.find_all().to_list()
        to_delete_items = []
        keep_items = []
        
        for item in all_items:
            valid_from = self.parse_date(item.valid_from)
            if valid_from:
                # Convert valid_from to UTC for comparison
                valid_from = valid_from.astimezone(timezone.utc)
                if valid_from >= cutoff_date:
                    to_delete_items.append(item)
                else:
                    keep_items.append(item)
            else:
                keep_items.append(item)

        # Get CanonicalItems to delete (those associated with items to be deleted)
        to_delete_item_ids = [item.item_id for item in to_delete_items]
        all_canonical_items = await CanonicalItem.find_all().to_list()
        to_delete_canonical_items = []
        keep_canonical_items = []

        for canonical_item in all_canonical_items:
            if canonical_item.item_id in to_delete_item_ids:
                to_delete_canonical_items.append(canonical_item)
            else:
                keep_canonical_items.append(canonical_item)

        # Print statistics
        print(f"\nFlyers Statistics:")
        print(f"Total flyers: {len(all_flyers)}")
        print(f"Flyers to delete: {len(to_delete_flyers)}")
        print(f"Flyers to keep: {len(keep_flyers)}")

        print(f"\nItems Statistics:")
        print(f"Total items: {len(all_items)}")
        print(f"Items to delete: {len(to_delete_items)}")
        print(f"Items to keep: {len(keep_items)}")

        print(f"\nCanonicalItems Statistics:")
        print(f"Total canonical items: {len(all_canonical_items)}")
        print(f"Canonical items to delete: {len(to_delete_canonical_items)}")
        print(f"Canonical items to keep: {len(keep_canonical_items)}")

        if not self.dry_run:
            print("\nPerforming deletion...")
            if to_delete_flyers:
                flyer_ids = [flyer.id for flyer in to_delete_flyers]
                await Flyers.find({"_id": {"$in": flyer_ids}}).delete()
                print(f"Deleted {len(to_delete_flyers)} flyers")
            
            if to_delete_items:
                item_ids = [item.id for item in to_delete_items]
                await Items.find({"_id": {"$in": item_ids}}).delete()
                print(f"Deleted {len(to_delete_items)} items")

            if to_delete_canonical_items:
                canonical_item_ids = [item.id for item in to_delete_canonical_items]
                await CanonicalItem.find({"_id": {"$in": canonical_item_ids}}).delete()
                print(f"Deleted {len(to_delete_canonical_items)} canonical items")
        else:
            print("\nDry run - no deletions performed")

    def run(self):
        """Run the deletion process"""
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.delete_future_data())

if __name__ == "__main__":
    deleter = DataDeleter(dry_run=False) # Set to False to actually delete data
    deleter.run()
