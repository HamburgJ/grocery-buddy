import requests
import json
from urllib.parse import quote_plus
from dotenv import load_dotenv
import os

load_dotenv()

# Load environment variables
BASE_URL = os.getenv('FLIPP_BASE_URL')
MERCHANTS_ENDPOINT = os.getenv('FLIPP_MERCHANTS_ENDPOINT')
ITEMS_SEARCH_ENDPOINT = os.getenv('FLIPP_ITEMS_SEARCH_ENDPOINT')
FLYERS_ENDPOINT = os.getenv('FLIPP_FLYERS_ENDPOINT')
ITEMS_ENDPOINT = os.getenv('FLIPP_ITEMS_ENDPOINT')
DATA_ENDPOINT = os.getenv('FLIPP_DATA_ENDPOINT')
CAT_DICT_ENDPOINT = os.getenv('FLIPP_CAT_DICT_ENDPOINT')
LOCALE = os.getenv('FLIPP_LOCALE', 'en-ca')

# Load postal codes from environment
postal_codes = os.getenv('POSTAL_CODES', '').split(',')

# Load scrapers from environment
SCRAPERS = os.getenv('MERCHANT_SCRAPERS', '').split(',')

def get_merchants():
    r = requests.get(f'{BASE_URL}{MERCHANTS_ENDPOINT}')
    return json.loads(r.text)['merchants']

def get_merchant_name_indentifiers(name):
    merchants = get_merchants()
    for merchant in merchants:
        if merchant['name'].lower() == name.lower():
            return merchant['name_identifier']
    return None

def get_merchant_flyer_ids(name_identifier, postal_code):
    url = f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}'
    params = {
        'locale': LOCALE,
        'postal_code': postal_code,
        'q': name_identifier
    }
    r = requests.get(url, params=params)
    return [flyer['id'] for flyer in json.loads(r.text)['flyers']]

def get_merchant_info(name_identifier, postal_code):
    url = f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}'
    params = {
        'locale': LOCALE,
        'postal_code': postal_code,
        'q': name_identifier
    }
    r = requests.get(url, params=params)
    return json.loads(r.text)['merchants']

def get_flyer_items(flyer_id, postal_code):
    url = f'{BASE_URL}{FLYERS_ENDPOINT}/{flyer_id}'
    params = {
        'locale': LOCALE,
        'postal_code': postal_code
    }
    r = requests.get(url, params=params)
    return json.loads(r.text)['items']

def get_item_info(item_id):
    url = f'{BASE_URL}{ITEMS_ENDPOINT}/{item_id}'
    r = requests.get(url)
    return json.loads(r.text)['item']

def get_grocery_flyers(postal_code):
    url = f'{BASE_URL}{DATA_ENDPOINT}'
    params = {
        'locale': LOCALE,
        'postal_code': postal_code,
        'include_flyer_metadata': 1
    }
    r = requests.get(url, params=params)
    return json.loads(r.text)['flyers']

def clean_flyer_item(flyer_item, merchant_name):
    return flyer_item | {'merchant': merchant_name}

def get_cat_dict():
    url = f'{BASE_URL}{CAT_DICT_ENDPOINT}'
    params = {
        'locale': LOCALE,
        'all_attributes': True
    }
    r = requests.get(url, params=params)
    return json.loads(r.text)['search_terms']

def get_category_items(category, postal_code):
    url = f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}'
    params = {
        'locale': LOCALE,
        'postal_code': postal_code,
        'q': quote_plus(category),
        'all_attributes': True
    }
    r = requests.get(url, params=params)
    return json.loads(r.text)['items']