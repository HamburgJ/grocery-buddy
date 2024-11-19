import re
from typing import Tuple, Optional

# Constants for unit handling
WEIGHT_UNITS = {
    'lb': 'pound',
    'pound': 'pound',
    'pounds': 'pound',
    'kg': 'kilogram',
    'kilo': 'kilogram',
    'kilos': 'kilogram',
    'kilogram': 'kilogram',
    'kilogramme': 'kilogram',
    'g': 'gram',
    'gram': 'gram',
    'grams': 'gram',
    'oz': 'ounce',
    'ounce': 'ounce',
    'ounces': 'ounce'
}

PACKAGE_UNITS = {
    'ea': 'each',
    'each': 'each',
    'pkg': 'each',
    'pack': 'each',
    'box': 'each',
    'bag': 'each',
    'basket': 'each',
    'case': 'each',
    'pk': 'each',
    'ml': 'each',
    'l': 'each',
    'oz': 'each',
    'unité': 'each',
    "l'unité": 'each',
    'douzaine': 'each',
    'dozen': 'each',
    'a': 'each',
    'any variety': 'each'
}

def build_unit_pattern():
    """Build regex pattern for unit matching"""
    weight_units = '|'.join(WEIGHT_UNITS.keys())
    package_units = '|'.join(PACKAGE_UNITS.keys())
    return f'(?:{weight_units}|{package_units})'

def build_separator_pattern():
    """Build regex pattern for unit separators"""
    return r'(?:\.{0,3}[\s\/\-\:\;]+\.{0,3}\s*)'

def preprocess_price_text(price_text: str) -> str:
    """Preprocess price text for consistent parsing"""
    if not price_text:
        return ""
    
    # Normalize to lowercase
    text = price_text.lower().strip()
    
    # Normalize French price format (7,99$ -> $7.99)
    text = re.sub(r'(\d+),(\d+)\$', r'$\1.\2', text)
    
    # Normalize multiple dots and spaces
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+', ' ', text)
    
    # Normalize multiple slashes
    text = re.sub(r'/{2,}', '/', text)
    
    return text

def is_unit_combination(price_text: str) -> bool:
    """Check if price text contains a valid unit combination"""
    unit_pattern = build_unit_pattern()
    separator_pattern = build_separator_pattern()
    
    # Don't consider these as combinations
    if is_simple_unit(price_text):
        return False
        
    # Check for unit combinations
    has_combo = (
        # Two or more units separated by any separator
        re.search(f'(?:{unit_pattern})(?:{separator_pattern}|.*?(?:or|,).*?)(?:{unit_pattern})', price_text, re.IGNORECASE) or
        # Double slash with price
        re.search(r'/.*?/\s*(?:ea|each|lb|kg)', price_text, re.IGNORECASE) or
        # "or" between different units
        re.search(f'(?:{unit_pattern}).*?(?:or|,).*?(?:{unit_pattern})', price_text, re.IGNORECASE) or
        # Each with any weight unit
        re.search(r'(?:ea|each).*?(?:lb|kg|pound|kilo|gram|oz|ounce)|(?:lb|kg|pound|kilo|gram|oz|ounce).*?(?:ea|each)', price_text, re.IGNORECASE)
    )
    
    # Don't mark as combination if it's a unit conversion
    if has_combo and is_unit_conversion(price_text):
        return False
        
    return has_combo

def determine_primary_unit(price_text: str) -> str:
    """Determine the primary unit from the price text"""
    # Check for 100g special case first
    if re.search(r'/100\s*g|100\s*g|/100(?!\d)', price_text):
        return '100_gram'
        
    # Check for French dozen
    if 'douzaine' in price_text or 'dozen' in price_text:
        return 'each'
    
    # Find first mentioned unit
    unit_pattern = build_unit_pattern()
    match = re.search(f'(?:^|/|\s)({unit_pattern})\.?(?:\s|$|/|,)', price_text)
    
    if match:
        unit = match.group(1).lower()
        # Check weight units first
        if unit in WEIGHT_UNITS:
            return WEIGHT_UNITS[unit]
        # Then check package units
        if unit in PACKAGE_UNITS:
            return PACKAGE_UNITS[unit]
    
    # If no match but has 'douzaine', return 'each'
    if 'douzaine' in price_text or 'dozen' in price_text:
        return 'each'
    
    return 'each'

def is_simple_unit(price_text: str) -> bool:
    """Check if the text is a simple unit without combinations"""
    # Simple patterns that should not be multi
    simple_patterns = [
        r'^/?(?:lb|kg|ea|each|box|case|pkg|pk|bag|basket|ml|l|oz|unité|a|pound)\.?/?$',  # Single unit with optional / and .
        r'^/?100\s*g$',  # 100g special case
        r'^\d+(?:ml|l|oz)$',  # Common volume measurements
        r'^(?:or|ou)\s+[\$\d]+(?:\.\d+)?\s*(?:each|ea|unité|l\'unité)(?:\s|$|\.)',  # Simple "or" price with unit
        r'^(?:\d+(?:\.\d+)?|[\$\d]+(?:\.\d+)?)\s*(?:each|ea)$',  # Simple price with unit
        r'^\*?\s*(?:each|ea)$',  # Just the word each
        r'^EA\s+OR\s+BUY\s+\d+\s+\$?\d+(?:\.\d+)?$'  # EA OR BUY pattern
    ]
    
    return any(re.search(pattern, price_text.lower().strip(), re.IGNORECASE) for pattern in simple_patterns)

def is_unit_conversion(price_text: str) -> bool:
    """Check if the text is a unit conversion (not multi)"""
    conversion_patterns = [
        r'/lb\s+\d+\.?\d*/kg',
        r'/kg\s+\d+\.?\d*/lb',
        r'lb\s+\d+\.?\d*/kg',
        r'kg\s+\d+\.?\d*/lb',
        r'(?:lb|kg).*?\$?\d+\.?\d*/(?:lb|kg)',  # Handles "kg., $1.99/lb." pattern
        r'/lb\s+\$?\d+\.?\d*\s*/kg',  # Added for "/lb $26.61 /KG" pattern
        r'/kg\s+\$?\d+\.?\d*\s*/lb'
    ]
    return any(re.search(pattern, price_text.lower()) for pattern in conversion_patterns)

def is_price_range_or_multiple(price_text: str) -> bool:
    """Check if text contains price ranges or multiple prices"""
    patterns = [
        r'(?:^|\s|,)\s*\$?\d+(?:\.\d+)?\s*(?:to|-)\s*\$?\d+',  # Price ranges with "to" or "-"
        r'\$?\d+(?:\.\d+)?(?:\s*,\s*\$?\d+(?:\.\d+)?)+',  # Multiple prices separated by commas
        r'or\s+.*?(?:\d+(?:\.\d+)?.*?){2,}',  # "or" followed by multiple numbers
    ]
    return any(re.search(pattern, price_text.lower()) for pattern in patterns)

def is_simple_price_with_unit(price_text: str) -> bool:
    """Check if this is a simple price with unit (not multi)"""
    patterns = [
        r'^(?:or|ou)\s+[\$\d]+(?:\.\d+)?\s*(?:each|ea|unité|l\'unité)(?:\s|$|\.)',
        r'^(?:or|ou)\s+[\$\d]+(?:\.\d+)?/(?:each|ea|unité|l\'unité)(?:\s|$|\.)',  # Added for "or 1.39/Ea" pattern
        r'^[\$\d]+(?:\.\d+)?\s*(?:each|ea|unité|l\'unité)(?:\s|$|\.)',
        r'(?:ea|each)\s+when\s+you\s+buy',
        r'EA\s+OR\s+BUY\s+\d+\s+\$?\d+(?:\.\d+)?$'
    ]
    return any(re.search(pattern, price_text.lower()) for pattern in patterns)


def parse_price_text(price_text: str) -> Tuple[str, Optional[float], Optional[bool]]:
    """Parse price text to determine unit type, quantity, and if multi-item"""
    if not price_text:
        return "each", None, None
        
    # Preprocess text
    processed_text = preprocess_price_text(price_text)
    
    # Basic non-price text check
    if not re.search(r'[\d\$]', processed_text):
        # Check if it's a valid unit before returning default
        unit_type = determine_primary_unit(processed_text)
        if is_simple_unit(processed_text):
            return unit_type, None, False
        if not re.search(r'(?:each|ea|lb|kg|pound|douzaine|dozen)', processed_text):
            return "each", None, None
    
    # Check for French dozen
    if 'douzaine' in processed_text or 'dozen' in processed_text:
        return 'each', 12.0, False
    
    # Check for quantity
    quantity_match = re.search(r'less than (\d+)', processed_text)
    if quantity_match:
        return 'each', float(quantity_match.group(1)), False
    
    # Check for simple price patterns
    if re.match(r'^(?:or|ou)\s+[\$\d]+(?:\.\d+)?\s*(?:each|ea|unité|l\'unité)(?:\s|$|\.)', processed_text):
        return 'each', None, False
        
    # Determine if multi-item
    is_multi = False
    
    if not is_simple_unit(processed_text):
        if (
            is_unit_combination(processed_text) or
            is_price_range_or_multiple(processed_text) or
            re.search(r'(?:^|\s)-\s*\$?\d+(?!\s*(?:ea|each|unité))(?=.*\d)', processed_text) or
            re.search(r'\d+(?:\.\d+)?/pkg', processed_text) or
            # Each with any weight unit
            re.search(r'(?:ea|each).*?(?:lb|kg|pound|kilo|gram|oz|ounce)|(?:lb|kg|pound|kilo|gram|oz|ounce).*?(?:ea|each)', processed_text, re.IGNORECASE)
        ):
            is_multi = True
    
    # Determine primary unit
    unit_type = determine_primary_unit(processed_text)
    
    return unit_type, None, is_multi


# Constants for price parsing
QUANTITY_PATTERNS = {
    r'(?i)^(\d+)\s*(?:for|\/|pack)': lambda x: int(x),  # "2 for", "3/", "5 pack"
    r'(?i)^any\s+(\d+)\s+for': lambda x: int(x),  # "Any 3 for"
    r'(?i)^(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+for': {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
}

UNIT_PRICE_PATTERNS = [
    # Match "less than X pay $Y ea."
    r'(?i)less than (\d+) (?:pay )?\$?([\d.]+) ea',
    # Match "or $X each" style patterns
    r'(?i)(?:or |OR )?\$?([\d.]+)(?:/| )?(?:each|ea\.?|Ea)',
    # Match "/Lb X.XX/kg" style patterns
    r'(?i)/Lb\s+\$?([\d.]+)/kg',
    # Match simple price patterns
    r'\$?([\d.]+)',
]

def parse_pre_price_text(text):
    if not text:
        return 1

    # Modify regex pattern to ensure we have a capture group
    match = re.search(r'(\d+)(?:\s*(?:PACK|FOR|for|\/)|$)', text)
    if match:
        try:
            return int(match.group(1))
        except (IndexError, ValueError):
            return 1
            
    # Handle text number cases
    number_map = {
        'one': 1,
        'two': 2, 
        'three': 3,
        'four': 4,
        'five': 5
    }
    
    for word, value in number_map.items():
        if word in text.lower():
            return value
            
    return 1

def parse_price(price: str) -> float:
    try:
        return float(price)
    except (ValueError, TypeError):
        return float('inf')

# value is determined to be as such:
    # For non unit='each', convert all units to each and lb.
    # For units='each', true_value = price/items_per_price
    # as per unit and per each items cannot be directly compared, we will add a large amount to force sorting
    # to be done first by unit == each. then by price
    # we will PRIORITIZE items which are by weight
def parse_value(pre_price_text: str, price: str, price_text: str) -> Tuple[float, str, Optional[float], bool]:
    items_per_price = parse_pre_price_text(pre_price_text)
    unit, quantity, is_multi = parse_price_text(price_text)
    price_float = parse_price(price)

    # Handle invalid price
    if price_float == float('inf'):
        return float('inf'), unit, quantity, is_multi

    # Calculate base value
    if unit == 'each':
        sorting_value = price_float / items_per_price if items_per_price > 0 else price_float
    else:
        # For weight units, use price directly as the sorting value
        # This prioritizes items sold by weight
        sorting_value = price_float
        
        # Convert all weight units to pounds for consistency
        if unit == 'kilogram':
            sorting_value /= 0.453592  # 1 kg = 2.20462 lbs
        elif unit == 'gram':
            sorting_value /= 0.00220462  # 1 g = 0.00220462 lbs
        elif unit == '100_gram':
            sorting_value /= 0.220462  # 100 g = 0.220462 lbs
        elif unit == 'ounce':
            sorting_value /= 0.0625  # 1 oz = 0.0625 lbs

    return sorting_value, unit, quantity, is_multi
