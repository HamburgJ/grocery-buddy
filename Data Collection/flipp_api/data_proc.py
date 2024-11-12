import ftfy
import re
price_replacements = {
    "¢": "",
    'or less than 2': 'or',
    'or less than 3': 'or',
    'or less than 4': 'or',
    'or less than 5': 'or',
    'or less than 6': 'or',
    'less than 2': 'or',
    'less than 3': 'or',
    'less than 4': 'or',
    'less than 5': 'or',
    'less than 6': 'or',
    'each': 'ea.',
    ' ea.': "",
    ' or /lb': "",
    '/lb': 'lb',
    " .": " $0.",
    ' ea': '',
    " for": "/",
    ' ealb': '',
    'lb.': 'lb'
}

def clean_text(text):
    text = text.lower()
    text = ftfy.fix_text(text)
    return text

def process_price(price):
    for key in price_replacements:
        price = price.replace(key, price_replacements[key])
    
# there are no categories, only items now.
# we can determine multi items from | in brands, but doesn't always occur