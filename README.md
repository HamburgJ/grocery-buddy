# Grocery Buddy - Smart Grocery Deal Finder 🛒# Grocery Buddy - Smart Grocery Deal Finder 🛒

A full-stack application that aggregates and analyzes grocery store flyers to help users find the best deals on produce and groceries across multiple retailers.

## 🌟 Features

- **Real-time Flyer Data**: Integrates with Flipp API to fetch current grocery store flyers
- **Smart Item Recognition**: Uses GPT-3.5 and spaCy for accurate produce identification
- **Price Analysis**: Compares prices across stores and tracks historical pricing
- **Multi-store Support**: Covers major Canadian grocery retailers including:
  - Loblaws
  - Metro
  - Food Basics
  - FreshCo
  - And many more ([See full list](
```95:115:Collection/flipp_api/backflipp.py
SCRAPERS = [
    'Food Basics',
    'FreshCo',
    'Metro',
    'Loblaws',
    'No Frills',
    'Giant Tiger',
    'Walmart',
    'Shoppers Drug Mart',
    'Real Canadian Superstore',
    'Sobeys',
    'Foodland',
    'Zehrs',
    'Fortino\'s',
    'Valu-Mart',
    'T&T Supermarket',
    'Freshmart',
    'Your Independent Grocer',
    'Farm Boy',
    'Longos'
]
```
))

## 🏗️ Architecture

### Backend Stack
- **Language**: Python 3.12
- **Database**: MongoDB (previously MSSQL)
- **ODM**: Beanie (MongoDB ODM)
- **API Integration**: Flipp API
- **ML/NLP**: 
  - OpenAI GPT-3.5
  - spaCy with `en_core_web_lg` model
  - scikit-learn for text processing

### Frontend Stack
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Additional Libraries**:
  - lucide-react for icons
  - react-medium-image-zoom for image handling

## 💾 Data Models

### Core Models

#### Merchants
```python
class Merchants(Document):
    merchant_id: int
    name: str
    name_identifier: str
    us_based: bool
    logo_url: Optional[str]
    storefront_logo_url: Optional[str]
```

#### Flyers
```python
class Flyers(Document):
    flyer_id: int
    merchant_id: int
    postal_code: str
    valid_from: Optional[datetime]
    valid_to: Optional[datetime]
    categories_csv: Optional[str]
```

For complete model definitions, see:

```1:147:Collection/flipp_api/models.py
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
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None
    categories_csv: Optional[str] = None

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
...
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

    class Settings:
        arbitrary_types_allowed = True
        indexes = [
            IndexModel([("item_id", ASCENDING)], unique=True),  # Keep existing unique index
            IndexModel([("flyer_id", ASCENDING)], background=True),  # Optional: if you query by flyer_id
            IndexModel([("merchant_id", ASCENDING)], background=True)  # Optional: if you query by merchant_id
        ]
...
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
```


## 🔄 Data Processing Pipeline

1. **Data Collection**
   - Fetches merchant data
   - Retrieves active flyers
   - Extracts item information
   - Processes images and descriptions

2. **Item Categorization**
   - Uses GPT-3.5 for accurate produce identification
   - Implements spaCy for NLP processing
   - Handles multi-item listings
   - Reference implementation:

```283:348:Collection/flipp_api/produce.py
def check_label_gpt(title, label, synonyms, non_matches):
    content = f" \
Listing: {title} \n \
Label: {label} \n \
Label Synonyms: [{', '.join(synonyms) if synonyms else ''}] \n \
Label Non-Matches: [{', '.join(non_matches) if non_matches else ''}]"

    response = openai_client.chat.completions.create(
        model = "gpt-3.5-turbo-1106",
        response_format = {"type": "json_object"},
        messages = [
            {
                "role": "system",
                "content": 
'''
You are a grocery flyer listing parser. 
You are helping to determine if a listing have been incorrectly labeled.
A listing may be refering to multiple items.
is_correct: true if it is referring to at least one item in the listing.
You will be given:
- 1 listing
- 1 label (which may be incorrect) 
- A (incomplete) list of synonyms for the label
- a list of items which the label specifically should NOT refer to

Labels should only match to the core entity of items in the listing.
This means that modifiers, flavorings, adjectives to items should not match.
Canned, frozen, pickled, dried, juice items should not match.
Salads, salsa, dips, condiments, soups, teas, drinks, candles should not match.
If the label is an ingredient to another item, it should not match.
Labels will always refer to fresh produce items.

Examples:
Label: "broccoli" Listing: broccoli soup", is_correct: false.
Label: "bell peppers" Listing: capsicums", is_correct: true.
Label: "blueberries" Listing: blueberry muffins", is_correct: false.
Label: "blueberries" Listing: blueberry, blackberries, raspberries", is_correct: true.
Label: "blueberries" Listing: blueberry, blackberry muffins", is_correct: false.
Label: "raspberries" Listing: RASPBERRY POINT OYSTERS", is_correct: false.
Label: "cherry" Listing: cherry tomatoes", is_correct: false.
Label: "herbs" Listing: HERBS & GARLIC OR CHILI & LIME SHRIMP", is_correct: false.
Label: "pears" Listing: Seedless Oranges Product of South Africa Bartlett Pears Product of USA Extra Fancy Grade", is_correct: true.
Label: "mangoes" Listing: Avocados Product of Mexico Red Mangoes Product of Brazil", is_correct: true.
Label: "oranges" Listing: Orange Chicken Sweet & Sour Pork Frozen", is_correct: false.
Label: "tomatoes" Listing: unique tomatoes", is_correct: false.
Label: "tomatoes" Listing: tomato ketchup", is_correct: false.

You must output JSON which is of the form:
{
    is_correct: true/false
}
'''
            },
            {
                "role": "user",
                "content": content
            }
        ]
    )

    json_str = response.choices[0].message.content

    try:
        return json_str.find('true') != -1
    except:
        return False
```


3. **Price Analysis**
   - Normalizes prices across different units
   - Handles various price formats (per lb, per kg, etc.)
   - Processes multi-item deals

## 🚀 Setup and Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB
- OpenAI API key
- Flipp API access

### Environment Variables
Create a `.env` file with:
```bash
MONGO_USER=your_username
MONGO_PASSWORD=your_password
MONGO_HOST=your_host
MONGO_DB=your_database
OPENAI_API_KEY=your_openai_key
```

### Backend Setup
1. Install Python dependencies:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_lg
```

2. Initialize database:
```bash
python db_updater.py
```

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

## 🔧 Development Tools

### Code Quality
- ESLint for JavaScript/React
- Type checking with Pydantic
- MongoDB indexing for performance

### Testing
- Unit tests (to be implemented)
- Integration tests (to be implemented)
- API endpoint testing (to be implemented)

## 📈 Future Improvements

1. **Data Collection**
   - Implement rate limiting
   - Add retry mechanisms
   - Cache frequently accessed data

2. **Analysis**
   - Add historical price tracking
   - Implement deal scoring algorithm
   - Add nutritional information

3. **User Experience**
   - Add user accounts
   - Implement shopping lists
   - Add price alerts

4. **Infrastructure**
   - Add CI/CD pipeline
   - Implement proper logging
   - Add monitoring and analytics

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Flipp API for providing flyer data
- OpenAI for GPT-3.5 API
- spaCy for NLP tools
- MongoDB for database hosting

## 📞 Contact

For questions or feedback, please open an issue in the repository.

---

**Note**: This project is for educational purposes and is not affiliated with any of the mentioned retailers.