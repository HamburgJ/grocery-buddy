const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    name_identifier: { type: String, required: true, unique: true },
    us_based: { type: Boolean, required: true },
    logo_url: { type: String },
    flyer_url: { type: String },
    is_active: { type: Boolean, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Merchant', merchantSchema, 'Merchants');