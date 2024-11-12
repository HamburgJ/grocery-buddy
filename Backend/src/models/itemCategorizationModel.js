const mongoose = require('mongoose');

const itemCategorizationSchema = new mongoose.Schema({
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ItemCategorization', itemCategorizationSchema, 'ItemCategorizations');