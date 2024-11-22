const PRE_PRICE_REPLACEMENTS = {
    'always': '',
    'rollback': '',
    'only': '',
};

const POST_PRICE_REPLACEMENTS = {
    'each': '',
    'each.': '',
    'ea.': '',
    'lb.': '/lb',
    '/ea': '',
    '/pkg': '',
    '//lb': '/lb',
    '//kg': '',
    // anything string which ends in /kg, erase whole string
    '([0-9.]+)?/kg': '',
};



const CAPITALIZATION_REPLACEMENTS = {
    'lb': 'lb',
}

const priceToText = (price) => {
    // parse to float
    return parseFloat(price).toFixed(2);
}

const processText = (text, replacements) => {
    text = text.toLowerCase();
    for (const [key, value] of Object.entries(replacements)) {
        text = text.replace(new RegExp(key, 'g'), value);
    }
    if (text.trim() === '') return '';
    return text;
}

export const getPriceValue = (item, categoryName, cat) => {
  // Special cases where we want to prioritize weight-based pricing
  const weightPriorityCategories = ['Meat & Seafood'];
  const weightPriorityItems = ['grapes', 'grapes red', 'apples', 'tomatoes'];
  
  // Check if this item/category should prioritize weight-based pricing
  const shouldPrioritizeWeight = 
    weightPriorityCategories.includes(cat) ||
    weightPriorityItems.includes(categoryName);

  // If weight should be prioritized, or item is sold by weight (not 'each')
  // Return actual price value
  if (shouldPrioritizeWeight) {
    return item.price + (item.unit == 'each' ? 100000 : 0);
  }
  
  // For items sold by 'each', artificially lower their price value
  // to ensure they appear after weight-based items in sorting
  return item.price + (item.unit == 'each' ? 0 : 100000);
};

// Update existing formatPrice function to handle unit display
export const formatPrice = (item) => {
  // Return placeholder if item is undefined
  if (!item) return 'N/A';
  
  // If we're dealing with a canonical item that has originalItem, use that
  const itemData = item.originalItem || item;
  
  let result = '';
  // Only access properties if they exist
  if (itemData.pre_price_text) {
    const prePriceText = processText(itemData.pre_price_text, PRE_PRICE_REPLACEMENTS);
    if (prePriceText) result += prePriceText + ' ';
  }
  
  // Ensure current_price exists
  if (itemData.current_price) {
    result += `$${priceToText(itemData.current_price)}`;
  }
  
  if (itemData.price_text) {
    const postPriceText = processText(itemData.price_text, POST_PRICE_REPLACEMENTS);
    if (postPriceText) result += ' ' + postPriceText;
  }
  return result;
}; 
