from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from flipp_api.models import Merchants, Flyers, Items, Scrapers, Categories, ItemCategorizations, CanonicalItem, CanonicalCategory
from dotenv import load_dotenv
import os
from pathlib import Path

# Get the project root directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env from root directory
load_dotenv(os.path.join(ROOT_DIR, '.env'))

async def init_db():
    # Construct MongoDB URL from environment variables
    db_url = (
        f"mongodb+srv://{os.getenv('MONGO_USER')}:"
        f"{os.getenv('MONGO_PASSWORD')}@"
        f"{os.getenv('MONGO_HOST')}/"
        "?retryWrites=true&w=majority"
    )
    
    client = AsyncIOMotorClient(db_url)
    await init_beanie(
        database=client[os.getenv('MONGO_DB')],
        document_models=[
            Merchants, Flyers, Items, Scrapers, Categories,
            ItemCategorizations, CanonicalItem, CanonicalCategory
        ]
    )

async def init_mssql():
    # Construct MSSQL URL from environment variables
    db_url = (
        f"mssql://{os.getenv('MSSQL_USER')}:"
        f"{os.getenv('MSSQL_PASSWORD')}@"
        f"{os.getenv('MSSQL_HOST')}:"
        f"{os.getenv('MSSQL_PORT')}/"
        f"{os.getenv('MSSQL_DB')}?"
        f"driver={os.getenv('MSSQL_DRIVER')}"
    )
    
    return db_url