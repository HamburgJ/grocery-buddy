const Merchant = require('../models/merchantModel');
const Flyer = require('../models/flyerModel');
const Scraper = require('../models/scraperModel');

exports.createMerchant = async (req, res) => {
    try {
        const merchant = new Merchant(req.body);
        await merchant.save();
        res.status(201).json(merchant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


exports.getMerchants = async (req, res) => {
    try {
        const merchants = await Merchant.aggregate([
            {
                $lookup: {
                    from: 'Scrapers', // The name of the Scraper collection
                    localField: 'merchant_id',
                    foreignField: 'merchant_id',
                    as: 'scraper'
                }
            },
            {
                $match: {
                    'scraper.merchant_id': { $exists: true, $ne: null }
                }
            },
            {
                $match: req.query
            }
        ]);

        res.status(200).json(merchants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMerchantById = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id);
        if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
        res.status(200).json(merchant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
        res.status(200).json(merchant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id);
        if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
        
        // Delete all flyers associated with this merchant
        await Flyer.deleteMany({ merchant: merchant._id });
        
        // Delete the merchant
        await merchant.remove();
        
        res.status(200).json({ message: 'Merchant and associated flyers deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};