import asyncio
from flipp_api.models import Merchants, Scrapers, Flyers, Items, Categories, ItemCategorizations
from flipp_api.db import init_db
from flipp_api.backflipp import *
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

class DBUpdater:
    def __init__(self):
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(init_db())

    async def update_merchants_async(self):
        merchants = get_merchants()
        merchants_formatted = [
            Merchants(
                merchant_id=merchant["id"],
                name=merchant["name"],
                name_identifier=merchant["name_identifier"],
                us_based=merchant["us_based"],
            )
            for merchant in merchants
        ]

        #TODO: use list of postal codes and keep searching until a store is found, as different merchants may only appear in certain regions
        # get additional info for merchants
        for merchant in merchants_formatted:
            merchant_info = get_merchant_info(merchant.name_identifier, postal_codes[0])
            # see if there is a match of merchant id in the list returned
            merchant_details = next((m for m in merchant_info if m.get('id') == merchant.merchant_id), None)
            if merchant_details:
                merchant.logo_url = merchant_details.get("logo_url")
                merchant.storefront_logo_url = merchant_details.get("storefront_logo_url")
                merchant.store_locator_url = merchant_details.get("store_locator_url")
                print(f"Updated merchant {merchant.name}")
            
        await Merchants.delete_all()
        await Merchants.insert_many(merchants_formatted)
        print("Created merchants")

    def update_merchants(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.update_merchants_async())

    async def create_scrapers_async(self):
        # will need to change this to filter out usa versions of mercahnts
        # walmartusa - 2175
        merchants = await Merchants.find({"name": {"$in": SCRAPERS}}).to_list()
        scrapers = [Scrapers(merchant_id=merchant.merchant_id) for merchant in merchants]
        await Scrapers.delete_all()
        await Scrapers.insert_many(scrapers)
        print("Created scrapers")

    def create_scrapers(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.create_scrapers_async())

    async def create_flyers_async(self):
        scrapers = await Scrapers.find_all().to_list()
        for scraper in scrapers:
            merchant = await Merchants.find_one({"merchant_id": scraper.merchant_id})
            flyer_ids = get_merchant_flyer_ids(merchant.name_identifier, postal_codes[0])
            if len(flyer_ids) == 0:
                continue

            flyers = [Flyers(flyer_id=flyer_id, merchant_id=scraper.merchant_id, postal_code=postal_codes[0]) for flyer_id in flyer_ids]
            existing_flyer_ids = {flyer.flyer_id for flyer in await Flyers.find_all().to_list()}
            new_flyers = [flyer for flyer in flyers if flyer.flyer_id not in existing_flyer_ids]
            if new_flyers:
                await Flyers.insert_many(new_flyers)
            print(f"Created flyers for {merchant.name}")

    def create_flyers(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.create_flyers_async())

    async def update_flyers_async(self):
        flyers_info = get_grocery_flyers(postal_codes[0])
        db_flyers = await Flyers.find_all().to_list()
        db_flyer_ids = [flyer.flyer_id for flyer in db_flyers]

        flyers_matched = [flyer for flyer in flyers_info if flyer['id'] in db_flyer_ids]

        for flyer in flyers_matched:
            db_flyer = await Flyers.find_one({"flyer_id": flyer['id']})
            if db_flyer:
                db_flyer.valid_from = flyer['valid_from']
                db_flyer.valid_to = flyer['valid_to']
                db_flyer.available_from = flyer['available_from']
                db_flyer.available_to = flyer['available_to']
                db_flyer.categories_csv = flyer['categories_csv']
                await db_flyer.save()
        print("Updated flyers")

    def update_flyers(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.update_flyers_async())

    async def fetch_items_async(self):
        flyers = await Flyers.find({"categories_csv": {"$regex": "Groceries"}}).to_list()
        for flyer in flyers:
            flyer_items = get_flyer_items(flyer.flyer_id, flyer.postal_code)
            items = [
                Items(
                    item_id=item["id"],
                    flyer_id=flyer.flyer_id,
                    merchant_id=flyer.merchant_id,
                    name=item["name"],
                    description=item.get("description"),
                    price=item.get("price"),
                    discount=item.get("discount"),
                    valid_from=item.get("valid_from"),
                    valid_to=item.get("valid_to"),
                    cutout_image_url=item.get("cutout_image_url"),
                    brand=item.get("brand"),
                )
                for item in flyer_items
            ]
            existing_item_ids = {item.item_id for item in await Items.find_all().to_list()}
            new_items = [item for item in items if item.item_id not in existing_item_ids]
            if new_items:
                await Items.insert_many(new_items)
            print(f"Created items for flyer {flyer.id}")

    def fetch_items(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.fetch_items_async())

    async def update_items_async(self):
        items = await Items.find({"image_url": None}).to_list()

        fields = [
            'brand', 'name', 'image_url', 'cutout_image_url', 'description', 'current_price',
            'current_price_range', 'pre_price_text', 'category', 'price_text', 'sale_story',
            'sku', 'ttm_url'
        ]

        for item in items:
            item_info = get_item_info(item.item_id)
            item_data = {k: v for k, v in item_info.items() if k in fields and v is not None}
            if item_data:
                await item.update({"$set": item_data})
                await item.save()
                print(f"Updated item {item.id}")

    def update_items(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.update_items_async())

    async def fetch_categories_async(self):
        categories = get_cat_dict()
        categories_formatted = [Categories(**category) for category in categories]
        await Categories.delete_all()
        await Categories.insert_many(categories_formatted)
        print("Created categories")

    def fetch_categories(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.fetch_categories_async())

    async def fetch_item_categories_async(self):
        categories = await Categories.find({"cat": {"$in": ['Pantry', 'Deli', 'Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Frozen']}, "is_clean": True}).to_list()
        items = await Items.find_all().to_list()
        item_ids = [item.item_id for item in items]

        for category in categories:
            category_items = get_category_items(category.base_name, postal_codes[0])
            if len(category_items) == 0:
                continue

            item_categorizations = [
                ItemCategorizations(item_id=item['id'], category_name=category.name)
                for item in category_items if item['id'] in item_ids
            ]
            existing_categorizations = await ItemCategorizations.find({
                "item_id": {"$in": [ic.item_id for ic in item_categorizations]},
                "category_name": {"$in": [ic.category_name for ic in item_categorizations]}
            }).to_list()

            existing_categorization_ids = {(ec.item_id, ec.category_name) for ec in existing_categorizations}

            new_categorizations = [
                ic for ic in item_categorizations
                if (ic.item_id, ic.category_name) not in existing_categorization_ids
            ]

            if new_categorizations:
                await ItemCategorizations.insert_many(new_categorizations)

            print(f"Created categorizations for {category.base_name}")

    def fetch_item_categories(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.fetch_item_categories_async())


    async def add_items_to_categories_async(self):
        categories = await Categories.find_all().to_list()
        for category in categories:
            item_categorizations = await ItemCategorizations.find({"category_name": category.name}).to_list()
            item_ids = [ic.item_id for ic in item_categorizations]
            category.items = item_ids
            await category.save()

    def add_items_to_categories(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.add_items_to_categories_async())

if __name__ == "__main__":

    db_updater = DBUpdater()
    # Uncomment the necessary method calls as needed
    #db_updater.create_scrapers()
    db_updater.update_merchants()
    #db_updater.create_flyers()
    #db_updater.update_flyers()
    #db_updater.fetch_items()
    #db_updater.update_items()
    #db_updater.fetch_categories()
    #db_updater.fetch_item_categories()
    #db_updater.add_items_to_categories()



'''
from tortoise import Tortoise, run_async
from flipp_api.backflipp import *
from flipp_api.models import *
from flipp_api.db import init_db

class DBUpdater:
    def __init__(self):
        run_async(init_db())
        # drop tables
        #run_async(Tortoise.generate_schemas()) 

    async def update_merchants_async(self):
        merchants = get_merchants()
        merchants_formatted = [
            Merchants(
                **merchant
            )
            for merchant in merchants
        ]
        await Merchants.all().delete()
        await Merchants.bulk_create(merchants_formatted)
        print("Created merchants")

    def update_merchants(self):
        run_async(self.update_merchants_async())

    async def create_scrapers_async(self):
        # get all merchants where name match one of the merchants in the SCRAPERS list
        merchants = await Merchants.filter(name__in=SCRAPERS)

        scrapers = [
            Scrapers(
                merchant_id = merchant.id
            )
            for merchant in merchants
        ]

        await Scrapers.all().delete()
        await Scrapers.bulk_create(scrapers)
        print("Created scrapers")

    def create_scrapers(self):
        run_async(self.create_scrapers_async())

    async def create_flyers_async(self):
        # get all scrapers and join merchant
        scrapers = await Scrapers.all().prefetch_related('merchant')

        #  get_merchant_flyer_ids
        for scraper in scrapers:
            flyer_ids = get_merchant_flyer_ids(scraper.merchant.name_identifier, postal_codes[0])
            if len(flyer_ids) == 0:
                continue
            
            flyers = [
                Flyers(
                    id=flyer_id,
                    merchant_id=scraper.merchant.id,
                    postal_code=postal_codes[0]
                )
                for flyer_id in flyer_ids
            ]
            await Flyers.bulk_create(flyers)
            print(f"Created flyers for {scraper.merchant.name}")

    def create_flyers(self):
        run_async(self.create_flyers_async())

    async def update_flyers_async(self):
        flyers_info = get_grocery_flyers(postal_codes[0])
        db_flyers = await Flyers.all().values('id')
        db_flyers = [flyer['id'] for flyer in db_flyers]

        flyers_matched = [flyer for flyer in flyers_info if flyer['id'] in db_flyers]

        flyers_formatted = [
            Flyers(
                id=flyer['id'],
                valid_from=flyer['valid_from'],
                valid_to=flyer['valid_to'],
                available_from=flyer['available_from'],
                available_to=flyer['available_to'],
                categories_csv=flyer['categories_csv']
            )
            for flyer in flyers_matched
        ]

        await Flyers.bulk_update(
            flyers_formatted, 
            fields=['valid_from', 'valid_to', 'available_from', 'available_to', 'categories_csv']
        )
        print("Updated flyers")


    def update_flyers(self):
        run_async(self.update_flyers_async())
    
    async def fetch_items_async(self):
        flyers = await Flyers.filter(categories_csv__contains='Groceries').prefetch_related('merchant')
        for flyer in flyers:
            flyer_items = get_flyer_items(flyer.id, flyer.postal_code)
            items = [
                Items(
                    **item
                )
                for item in flyer_items
            ]
            await Items.bulk_create(items)
            print(f"Created items for {flyer.merchant.name}")

    def fetch_items(self):
        run_async(self.fetch_items_async())

    async def update_items_async(self):
        # get all items where image_url is None
        items = await Items.filter(image_url=None).prefetch_related('flyer__merchant')

        fields=[
            'brand',
            'name',
            'image_url',
            'cutout_image_url',
            'description',
            'current_price',
            'current_price_range',
            'pre_price_text',
            'category',
            'price_text',
            'sale_story',
            'sku',
            'ttm_url'
        ]

        for item in items:
            item_info = get_item_info(item.id)
            item_info = {k: v for k, v in item_info.items() if v is not None and k in fields+['id']}
            item_info['id'] = item.id
            item_formatted = Items(**item_info)
            await item_formatted.save(update_fields=fields)
            print(f"Updated item {item.id}")


    def update_items(self):
        run_async(self.update_items_async())

    async def fetch_categories_async(self):
        categories = get_cat_dict()
        categories_formatted = [
            Categories(
                **category
            )
            for category in categories
        ]

        await Categories.all().delete()
        await Categories.bulk_create(categories_formatted)
        print("Created categories")

    def fetch_categories(self):
        run_async(self.fetch_categories_async())

    async def fetch_item_categories_async(self):
        categories = await Categories.filter(
            cat__in=['Pantry', 'Deli', 'Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Frozen'],
            is_clean=1,
        )
        items = await Items.all().values('id')
        items_ids = [item['id'] for item in items]

        for category in categories:
            category_items = get_category_items(
                category.base_name,
                postal_codes[0]
            )
            if len(category_items) == 0:
                continue

            items_categorizations = [
                ItemCategorizations(
                    item_id=item_categorization['id'],
                    category_id=category.id
                )
                for item_categorization in category_items
                if item_categorization['id'] in items_ids
            ]

            await ItemCategorizations.bulk_create(items_categorizations)
            print(f"Created categorizations for {category.base_name}")

    def fetch_item_categories(self):
        run_async(self.fetch_item_categories_async())



if __name__ == "__main__":
    db_updater = DBUpdater()
    #db_updater.update_merchants()
    #db_updater.create_scrapers()
    #db_updater.create_flyers()
    #db_updater.update_flyers()
    #db_updater.fetch_items()
    #db_updater.update_items()
    #db_updater.fetch_categories()
    db_updater.fetch_item_categories()
    '''