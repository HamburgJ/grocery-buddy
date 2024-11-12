from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from flipp_api.backflipp import get_merchants
from flipp_api.models import *
from flipp_api.db import init_db
from dotenv import load_dotenv
import os

load_dotenv()

async def run():
    await init_db()
    print("Connected to MongoDB")

    merchants = get_merchants()
    print("Got merchants")

    merchants_formatted = [
        Merchants(
            merchant_id=merchant["id"],
            name=merchant["name"],
            name_identifier=merchant["name_identifier"],
            us_based=merchant["us_based"],
        )
        for merchant in merchants
    ]
    
    await Merchants.delete_all()
    print("Dropped collection")
    await Merchants.insert_many(merchants_formatted)
    print("Inserted merchants")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run())