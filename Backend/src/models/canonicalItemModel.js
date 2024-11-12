const mongoose = require('mongoose');

const canonicalItemSchema = new mongoose.Schema({
    item_id: { type: Number, required: true },
    flyer_id: { type: Number, required: true },
    canonical_category: { type: String, default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    value: { type: Number, default: null },
    size: { type: String, default: null },
    unit: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('CanonicalItem', canonicalItemSchema, 'CanonicalItem');

