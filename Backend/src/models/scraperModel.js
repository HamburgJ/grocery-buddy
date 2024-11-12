const mongoose = require('mongoose');

const scraperSchema = new mongoose.Schema({
    merchant_id: { type: Number, required: true },
    last_run: { type: Date, default: null },
    logs: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Scraper', scraperSchema, 'Scrapers');