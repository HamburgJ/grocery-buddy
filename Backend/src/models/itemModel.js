const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
    item_id: { type: Number, unique: true, required: true },
    flyer_id: { type: Number },
    merchant_id: { type: Number },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: String },
    current_price: { type: String },
    current_price_range: { type: String },
    pre_price_text: { type: String },
    category: { type: String },
    price_text: { type: String },
    sale_story: { type: String },
    sku: { type: String },
    ttm_url: { type: String },
    discount: { type: Number },
    valid_from: { type: Date },
    valid_to: { type: Date },
    cutout_image_url: { type: String },
    brand: { type: String },
    image_url: { type: String },
    categories: [{ type: String }]
}, { timestamps: true });

itemSchema.index({ item_id: 1 }, { unique: true });
itemSchema.index({ categories: 1 });

module.exports = mongoose.model('Item', itemSchema, 'Items');