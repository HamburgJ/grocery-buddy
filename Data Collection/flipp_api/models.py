# models.py

from beanie import Document
from bson import ObjectId
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pymongo import IndexModel, ASCENDING

# Flyers model
class Flyers(Document):
    _id: ObjectId  # MongoDB ObjectId type
    flyer_id: int
    merchant_id: int  # renamed retailer_id to merchant_id
    postal_code: str
    scraped: bool = False
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None
    categories_csv: Optional[str] = None
    postal_code: Optional[str] = None

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("flyer_id", ASCENDING)], unique=True)
        ]


# Merchants model (formerly Retailers)
class Merchants(Document):
    _id: ObjectId
    merchant_id: int  # renamed retailer_id to merchant_id
    name: str
    name_identifier: str
    us_based: bool
    logo_url: Optional[str] = None
    storefront_logo_url: Optional[str] = None
    store_locator_url: Optional[str] = None

    

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("merchant_id", ASCENDING)], unique=True)
        ]


# Categories model
class Categories(Document):
    _id: ObjectId
    name: str
    cat: str
    canonical_category: Optional[str] = None
    base_name: Optional[str] = None
    icon_url: Optional[str] = None
    is_clean: Optional[bool] = None
    items: Optional[List[int]] = None
    priority_rank: Optional[int] = None

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("name", ASCENDING)], unique=True)
        ]


# Items model
class Items(Document):
    _id: ObjectId
    item_id: int
    flyer_id: int
    merchant_id: int
    name: str
    description: Optional[str] = None
    price: Optional[str] = None
    current_price: Optional[str] = None
    current_price_range: Optional[str] = None
    pre_price_text: Optional[str] = None
    category: Optional[str] = None
    price_text: Optional[str] = None
    sale_story: Optional[str] = None
    sku: Optional[str] = None
    ttm_url: Optional[str] = None
    discount: Optional[float] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    cutout_image_url: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    categories: List[str] = []

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("item_id", ASCENDING)], unique=True),  # Keep existing unique index
            IndexModel([("flyer_id", ASCENDING)], background=True),  # Optional: if you query by flyer_id
            IndexModel([("merchant_id", ASCENDING)], background=True),  # Optional: if you query by merchant_id
            IndexModel([("categories", ASCENDING)], background=True),  # Add index for categories
            IndexModel([("valid_from", ASCENDING)], background=True),
            IndexModel([("valid_to", ASCENDING)], background=True)
        ]


# Scrapers model
class Scrapers(Document):
    _id: ObjectId
    merchant_id: int  # renamed retailer_id to merchant_id
    last_run: Optional[datetime] = None
    logs: Optional[str] = None

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("merchant_id", ASCENDING)], unique=True)
        ]


# ItemCategorizations model
class ItemCategorizations(Document):
    _id: ObjectId
    item_id: int
    category_name: str

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("item_id", ASCENDING), ("category_name", ASCENDING)], unique=True)
        ]


# Represent True category, as opposed to a "category", which is anything which flipper has categorized
# The purpose of CanonicalCategory is a holder for items which have prices which can be compared
class CanonicalCategory(Document):
    _id: ObjectId
    name: str
    cat: str
    base_name: Optional[str] = None
    icon_url: Optional[str] = None
    is_clean: Optional[bool] = None
    items: Optional[List[int]] = None
    interest: Optional[float] = None # represents how much this category should be prioritized
    value: Optional[float] = None # represents how good the deals are in this category
    categories: Optional[List[str]] = None # ids of categories which are combined into this category

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("name", ASCENDING)], background=True),  # Add index on name for the join
            IndexModel([("cat", ASCENDING)], background=True)    # Optional: if you frequently query by cat
        ]

# Represent a single item, generally each CanonicalItem is associated with a single SKU.
# Associated with a single price, and a single flyer posting
class CanonicalItem(Document):
    _id: ObjectId
    item_id: int
    flyer_id: int
    canonical_category: Optional[str] = None
    name: Optional[str] = None
    price: Optional[float] = None
    value: Optional[float] = None
    size: Optional[str] = None
    unit: Optional[str] = None
 

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("item_id", ASCENDING)], background=True),
            IndexModel([("canonical_category", ASCENDING)], background=True),
            # Compound index for both fields used in the aggregation
            IndexModel([("canonical_category", ASCENDING), ("item_id", ASCENDING)], background=True)
        ]
