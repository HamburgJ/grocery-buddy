const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    cat: { type: String, required: true },
    canonical_category: { type: String, default: null },
    base_name: { type: String, default: null },
    icon_url: { type: String, default: null },
    is_clean: { type: Boolean, default: null },
    items: [{ type:Number, ref: 'Item' , default: []}],
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema, 'Categories');