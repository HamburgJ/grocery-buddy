import requests
import json
from urllib.parse import quote_plus
from dotenv import load_dotenv
import os
import time
from functools import wraps
import logging
from requests.exceptions import RequestException

MAX_RETRIES = 10
BASE_RETRY_DELAY = 1
MAX_RETRY_DELAY = 300
RATE_LIMIT_DELAY = 0.5

def with_retry_and_throttle(func):
    """Decorator to add retry logic and throttling to API calls"""
    last_request_time = 0
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        nonlocal last_request_time
        
        # Throttle requests
        current_time = time.time()
        time_since_last_request = current_time - last_request_time
        if time_since_last_request < RATE_LIMIT_DELAY:
            time.sleep(RATE_LIMIT_DELAY - time_since_last_request)
        
        for attempt in range(MAX_RETRIES):
            try:
                last_request_time = time.time()
                response = func(*args, **kwargs)
                response.raise_for_status()
                return json.loads(response.text)
            except RequestException as e:
                if attempt == MAX_RETRIES - 1:
                    logging.error(f"Failed after {MAX_RETRIES} attempts: {str(e)}")
                    raise
                
                # Calculate exponential backoff with min and max bounds
                delay = min(MAX_RETRY_DELAY, BASE_RETRY_DELAY * (2 ** attempt))
                logging.warning(f"Attempt {attempt + 1} failed: {str(e)}. Waiting {delay} seconds before retry.")
                time.sleep(delay)
    
    return wrapper

@with_retry_and_throttle
def make_request(url, params=None):
    """Generic request function"""
    return requests.get(url, params=params)

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
# log all the variables
print(f"BASE_URL: {BASE_URL}")
print(f"MERCHANTS_ENDPOINT: {MERCHANTS_ENDPOINT}")
print(f"ITEMS_SEARCH_ENDPOINT: {ITEMS_SEARCH_ENDPOINT}")
print(f"FLYERS_ENDPOINT: {FLYERS_ENDPOINT}")
print(f"ITEMS_ENDPOINT: {ITEMS_ENDPOINT}")
print(f"DATA_ENDPOINT: {DATA_ENDPOINT}")
print(f"CAT_DICT_ENDPOINT: {CAT_DICT_ENDPOINT}")
print(f"LOCALE: {LOCALE}")

# Load postal codes from environment
postal_codes = os.getenv('POSTAL_CODES', '').split(',')

# Load scrapers from environment
SCRAPERS = os.getenv('MERCHANT_SCRAPERS', '').split(',')

def get_merchants():
    print("Getting all merchants...")
    response = make_request(f'{BASE_URL}{MERCHANTS_ENDPOINT}')
    return response['merchants']

def get_merchant_name_indentifiers(name):
    print(f"Getting merchant name identifier for {name}...")
    merchants = get_merchants()
    for merchant in merchants:
        if merchant['name'].lower() == name.lower():
            return merchant['name_identifier']
    return None

def get_merchant_flyer_ids(name_identifier, postal_code):
    print(f"Getting flyer IDs for merchant {name_identifier} at {postal_code}...")
    response = make_request(
        f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}',
        params={
            'locale': LOCALE,
            'postal_code': postal_code,
            'q': name_identifier
        }
    )
    return [flyer['id'] for flyer in response['flyers']]

def get_merchant_info(name_identifier, postal_code):
    print(f"Getting merchant info for {name_identifier} at {postal_code}...")
    response = make_request(
        f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}',
        params={
            'locale': LOCALE,
            'postal_code': postal_code,
            'q': name_identifier
        }
    )
    return response['merchants']

def get_flyer_items(flyer_id, postal_code):
    print(f"Getting items for flyer {flyer_id} at {postal_code}...")
    response = make_request(
        f'{BASE_URL}{FLYERS_ENDPOINT}/{flyer_id}',
        params={
            'locale': LOCALE,
            'postal_code': postal_code
        }
    )
    return response['items']

def get_item_info(item_id):
    print(f"Getting info for item {item_id}...")
    response = make_request(f'{BASE_URL}{ITEMS_ENDPOINT}/{item_id}')
    return response['item']

def get_grocery_flyers(postal_code):
    print(f"Getting grocery flyers for {postal_code}...")
    response = make_request(
        f'{BASE_URL}{DATA_ENDPOINT}',
        params={
            'locale': LOCALE,
            'postal_code': postal_code,
            'include_flyer_metadata': 1
        }
    )
    return response['flyers']

def clean_flyer_item(flyer_item, merchant_name):
    print(f"Cleaning flyer item for {merchant_name}...")
    return flyer_item | {'merchant': merchant_name}

def get_cat_dict():
    print("Getting category dictionary...")
    response = make_request(
        f'{BASE_URL}{CAT_DICT_ENDPOINT}',
        params={
            'locale': LOCALE,
            'all_attributes': True
        }
    )
    return response['search_terms']

def get_category_items(category, postal_code):
    print(f"Getting items for category {category} at {postal_code}...")
    response = make_request(
        f'{BASE_URL}{ITEMS_SEARCH_ENDPOINT}',
        params={
            'locale': LOCALE,
            'postal_code': postal_code,
            'q': quote_plus(category),
            'all_attributes': True
        }
    )
    return response['items']