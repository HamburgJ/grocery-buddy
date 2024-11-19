const mongoose = require('mongoose');
const canonicalCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    cat: { type: String, required: true },
    base_name: { type: String, default: null },
    icon_url: { type: String, default: null },
    is_clean: { type: Boolean, default: null },
    items: [{ type: Number, ref: 'Item', default: [] }],
    interest: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    categories: [{ type: String, default: [] }]
}, { timestamps: true });

// Add text index on name and base_name fields

canonicalCategorySchema.index({ name: 'text', base_name: 'text' });
canonicalCategorySchema.index({ cat: 1 });

module.exports = mongoose.model('CanonicalCategory', canonicalCategorySchema, 'CanonicalCategory');

