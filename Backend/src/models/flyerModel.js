const mongoose = require('mongoose');

const flyerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true });

module.exports = mongoose.model('Flyer', flyerSchema, 'Flyers');