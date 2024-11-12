import spacy
from spacy.matcher import Matcher
from openai import OpenAI
import json
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import pandas as pd

# Load environment variables from .env file
load_dotenv()

# Define food patterns
food_patterns = [
        {
            "label": "bell peppers",
            "positive": ["bell peppers", "sweet peppers", "capsicums",
                         "bell pepper", "sweet pepper", "capsicum"],
            "negative": ["hot pepper", "jalapeno",
                         "hot peppers", "jalapenos"],
        },
        {
            "label": "avocados",
            "positive": ["avocados", "avocado"],
            "negative": [],
        },
        {
            "label": "onions",
            "positive": ["onions",
                         "onion"],
            "negative": ["green onion", "spring onion",
                         "green onions", "spring onions"],
        }, {
            "label": "apples",
            "positive": ["apples", "apple"],
            "negative": [],
        },
        {
            "label": "oranges",
            "positive": ["oranges", "mandarin orange", "clementines"],
            "negative": [],
        },
        {
            "label": "strawberries",
            "positive": ["strawberries", "strawberry"],
            "negative": [],
        },
        {
            "label": "yams",
            "positive": ["yams", "yam"],
            "negative": [],
        },
        {
            "label": "dates",
            "positive": ["dates", "date"],
            "negative": [],
        },
        {
            "label": "pineapples",
            "positive": ["pineapples", "pineapple"],
            "negative": [],
        },
        {
            "label": "pears",
            "positive": ["pears", "pear"],
            "negative": [],
        },
        {
            "label": "celery",
            "positive": ["celery"],
            "negative": [],
        },
        {
            "label": "mangoes",
            "positive": ["mangoes", "mango"],
            "negative": [],
        },
        {
            "label": "watermelons",
            "positive": ["watermelons", "watermelon"],
            "negative": [],
        },
        {
            "label": "asparagus",
            "positive": ["asparagus", "asparagus spear"],
            "negative": [],
        },
        {
            "label": "bananas",
            "positive": ["bananas", "banana"],
            "negative": [],
        },
        {
            "label": "peaches",
            "positive": ["peaches", "peach"],
            "negative": [],
        },
        {
            "label": "plums",
            "positive": ["plums", "plum"],
            "negative": [],
        },
        {
            "label": "limes",
            "positive": ["limes", "lime"],
            "negative": [],
        },
        {
            "label": "nectarines",
            "positive": ["nectarines", "nectarine"],
            "negative": [],
        },
        {
            "label": "mushrooms",
            "positive": ["mushrooms", "mushroom"],
            "negative": [],
        },
        {
            "label": "carrots",
            "positive": ["carrots", "carrot"],
            "negative": [],
        },
        {
            "label": "ginger",
            "positive": ["ginger"],
            "negative": [],
        },
        {
            "label": "garlic",
            "positive": ["garlic"],
            "negative": [],
        },
        {
            "label": "radishes",
            "positive": ["radishes", "radish"],
            "negative": ["pickled radish"],
        },
        {
            "label": "spinach",
            "positive": ["spinach"],
            "negative": ["spinach dip"],
        },
        {
            "label": "tomato",
            "positive": ["tomato", "tomatoes", "tomatoes on the vine", "roma tomatoes"],
            "negative": ["tomato sauce", "tomato paste", "tomato soup"],
        },
        {
            "label": "kiwis",
            "positive": ["kiwis", "kiwi"],
            "negative": [],
        },
        {
            "label": "pomegranates",
            "positive": ["pomegranates", "pomegranate"],
            "negative": [],
        },
        {
            "label": "papayas",
            "positive": ["papayas", "papaya"],
            "negative": [],
        },
        {
            "label": "eggplants",
            "positive": ["eggplants", "eggplant"],
            "negative": [],
        },
        {
            "label": "zucchinis",
            "positive": ["zucchinis", "zucchini"],
            "negative": [],
        },
        {
            "label": "sweet potatoes",
            "positive": ["sweet potatoes", "sweet potato"],
            "negative": [],
        },
        {
            "label": "apricots",
            "positive": ["apricots", "apricot"],
            "negative": [],
        },
        {
            "label": "artichokes",
            "positive": ["artichokes", "artichoke"],
            "negative": [],
        },
        {
            "label": "rutabagas",
            "positive": ["rutabagas", "rutabaga"],
            "negative": [],
        },
        {
            "label": "plantains",
            "positive": ["plantains", "plantain"],
            "negative": [],
        },
        {
            "label": "acorn squash",
            "positive": ["acorn squash", "acorn"],
            "negative": [],
        },
        {
            "label": "butternut squash",
            "positive": ["butternut squash", "butternut"],
            "negative": [],
        },
        {
            "label": "kale",
            "positive": ["kale"],
            "negative": [],
        },
        {
            "label": "leeks",
            "positive": ["leeks", "leek"],
            "negative": [],
        },
        {
            "label": "green beans",
            "positive": ["green beans", "green bean"],
            "negative": [],
        },
        {
            "label": "arugula",
            "positive": ["arugula"],
            "negative": [],
        },
        {
            "label": "endive",
            "positive": ["endive"],
            "negative": [],
        },
        {
            "label": "fennel",
            "positive": ["fennel"],
            "negative": [],
        },
        {
            "label": "okra",
            "positive": ["okra"],
            "negative": [],
        },
        {
            "label": "turnips",
            "positive": ["turnips", "turnip"],
            "negative": [],
        },
        {
            "label": "persimmons",
            "positive": ["persimmons", "persimmon"],
            "negative": [],
        },
        {
            "label": "chard",
            "positive": ["chard"],
            "negative": [],
        },
        {
            "label": "dragon fruit",
            "positive": ["dragon fruit", "dragonfruit"],
            "negative": [],
        },
        {
            "label": "grapes",
            "positive": ["grapes", "grape"],
            "negative": [],
        },
        {
            "label": "cucumbers",
            "positive": ["cucumbers", "cucumber"],
            "negative": [],
        },
        {
            "label": "cauliflower",
            "positive": ["cauliflower"],
            "negative": [],
        }
    ]
openai_client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY')
)

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
    
def extract_quantity_gpt(title, label, synonyms):
    response = openai_client.chat.completions.create(
        model = "gpt-3.5-turbo-1106",
        response_format = {"type": "json_object"},
        messages = [
            {
                "role": "system",
                "content": 
'''
You are a grocery flyer listing parser. 
You are helping to determine the range in the quantity of a specific item in a listing.
You will be given:
- 1 listing
- 1 label of an item in the listing
- A list of synonyms for the label

Sometimes multiple items appear in a listing before a quantity is specified for all of them.
Sometimes listings contain multiple items of different quantities.
For example,
Label: "blueberries" Listing: blueberries or raspberries, 1 qt.", the quantity is 
{
    "min": 1
    "max": 1
    "unit": "qt"
}
Label: "blueberries" Listing: blueberries pkg. or raspberries, 1 qt.", the quantity is
null
Label: "blueberries" Listing: blueberries or raspberries, 190-280g", the quantity
{
    "min": 190
    "max": 280
    "unit": "g"
}
# example where there is a weight for another item but not labe
Label: "watermelon" Listing: watermelons, strawberries, 1 lb.", the quantity is
null

You must output JSON which is of the form:
{
    "quantity": {
        "min": min_quantity,
        "max": max_quantity,
        "unit": unit
    } | null
}
'''
            },
            {
                "role": "user",
                "content": 
f" \n \
Listing: {title} \n \
Label: {label} \n \
Label Synonyms: [{', '.join(synonyms)}] \
"
            }
        ]
    )

    json_str = response.choices[0].message.content
    cleaned = json_str.replace('\n', '').replace('\t', ' ').replace('\r', ' ')
    try:
        di = json.loads(cleaned)
    except:
        return None

    if di['quantity'] is None:
        return None
    
    return di['quantity']

# Load the spaCy English model
nlp = spacy.load("en_core_web_lg")
positive_matcher = Matcher(nlp.vocab)
negative_matcher = Matcher(nlp.vocab)

# Create patterns for the food Matcher
for pattern in food_patterns:
    positive_patterns = [[{"LOWER": word.lower()} for word in phrase.split()]
                            for phrase in pattern["positive"]]
    negative_patterns = [[{"LOWER": word.lower()} for word in phrase.split()]
                            for phrase in pattern["negative"]]
    positive_matcher.add(pattern["label"], positive_patterns)
    negative_matcher.add(pattern["label"], negative_patterns)

def find_produce_items(doc):

    # Apply the food Matcher to the document
    positive_food_matches = positive_matcher(doc)
    negative_food_matches = negative_matcher(doc)

    # Remove any positive matches if there is a negative match in the document with same label
    for match_id, start, end in negative_food_matches:
        for p_match_id, p_start, p_end in positive_food_matches:
            if p_match_id == match_id:
                positive_food_matches.remove((p_match_id, p_start, p_end))

    # return a list of labels that matched (not the text that appeared in the document, but the label)
    match_labels = [doc.vocab.strings[match_id] for match_id, start, end in positive_food_matches]
    return list(set(match_labels))

mongo_client = MongoClient(
    f"mongodb+srv://{os.getenv('MONGO_USER')}:{os.getenv('MONGO_PASSWORD')}@{os.getenv('MONGO_HOST')}/?retryWrites=true&w=majority"
)
db = mongo_client[os.getenv('MONGO_DB')]
collection = db['backflipp_grocery']
# covert to dataframe, using only fields 
# id(as df id), brand, current_price, description, merchant, name, pre_price_text, price_text, sale_story

df = pd.DataFrame(list(collection.find({}, {'_id': 0, 'id': 1, 'brand': 1, 'current_price': 1, 'description': 1, 'merchant': 1, 'name': 1, 'pre_price_text': 1, 'price_text': 1, 'sale_story': 1}))) 

# drop duplicates on name, price, merchant
df = df.drop_duplicates(subset=['name', 'current_price', 'merchant'], keep='first')

# drop all rows with merchant M&M Food Market
df = df[df['merchant'] != 'M&M Food Market']

df['spacy_matches'] = df['name'].apply(lambda x: find_produce_items(nlp(x)))
# initialize gpt_matches column as empty list
df['gpt_matches'] = [[] for _ in range(len(df))]
for i, matches in enumerate(df['spacy_matches']):
    for match in matches:
        pattern = [pattern for pattern in food_patterns if pattern["label"] == match][0]
        if check_label_gpt(str(df.iloc[i]['name']),
                            match, pattern["positive"], pattern["negative"]):
            df.iloc[i]['gpt_matches'].append(match)
                               
# for each pattern_label, create an object:
'''
{
    "label: pattern_label,
    "items": [
        ...int
    ]
}
where label is all possible pattern labels and items is the id
of all items where that label appears in the gpt_matches column
'''

# create a list of all possible pattern labels
pattern_labels = [pattern["label"] for pattern in food_patterns]
item_docs = [{
    "label": label,
    "items": [] 
} for label in pattern_labels]

# for each item, add the id to the items list of the corresponding label
for i, row in df.iterrows():
    for label in row['gpt_matches']:
        item_docs[pattern_labels.index(label)]['items'].append(row['id'])



item_docs = [item for item in item_docs if len(item['items']) > 0]


# get a duck duck go image url of the item
from duckduckgo_search import DDGS
for item in item_docs:
    with DDGS() as ddgs:
        results_generator = ddgs.images(f'{item['label']} jpg white background', max_results=15)
        first_result = min(results_generator,
            key=lambda x: x['height']*x['width']
                 if x['height'] > 100 and x['width'] > 100 else float('inf'))
        item['image_url'] = first_result['image']

# add to collection "labels_to_items"
labels_to_items = db['labels_to_items']
labels_to_items.delete_many({})
labels_to_items.insert_many(item_docs)
