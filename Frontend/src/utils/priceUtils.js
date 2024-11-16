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

export const formatPrice = (item) => {
    let result = '';
    if (item.pre_price_text ) {
        const prePriceText = processText(item.pre_price_text, PRE_PRICE_REPLACEMENTS);
        if (prePriceText) result += prePriceText + ' ';
    }
    result += `$${priceToText(item.current_price)}`;
    if (item.price_text) {
        const postPriceText = processText(item.price_text, POST_PRICE_REPLACEMENTS);
        if (postPriceText) result += ' ' + postPriceText;
    }
    return result;
}; 
