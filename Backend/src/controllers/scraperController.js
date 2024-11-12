const Scraper = require('../models/scraperModel');

exports.createScraperLog = async (req, res) => {
    try {
        const scraper = new Scraper(req.body);
        await scraper.save();
        res.status(201).json(scraper);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getScraperLogs = async (req, res) => {
    try {
        const scrapers = await Scraper.find(req.query).sort({ lastRun: -1 });
        res.status(200).json(scrapers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLatestScraperLog = async (req, res) => {
    try {
        const scraper = await Scraper.findOne({ source: req.params.source })
            .sort({ lastRun: -1 });
        if (!scraper) return res.status(404).json({ error: 'No scraper logs found for this source' });
        res.status(200).json(scraper);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};