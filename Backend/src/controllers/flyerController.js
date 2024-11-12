const Flyer = require('../models/flyerModel');
const Item = require('../models/itemModel');

exports.createFlyer = async (req, res) => {
    try {
        const flyer = new Flyer(req.body);
        await flyer.save();
        res.status(201).json(flyer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getFlyers = async (req, res) => {
    try {
        const flyers = await Flyer.find(req.query)
            .populate('merchant')
            .populate('items');
        res.status(200).json(flyers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFlyerById = async (req, res) => {
    try {
        const flyer = await Flyer.findById(req.params.id)
            .populate('merchant')
            .populate('items');
        if (!flyer) return res.status(404).json({ error: 'Flyer not found' });
        res.status(200).json(flyer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateFlyer = async (req, res) => {
    try {
        const flyer = await Flyer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!flyer) return res.status(404).json({ error: 'Flyer not found' });
        res.status(200).json(flyer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteFlyer = async (req, res) => {
    try {
        const flyer = await Flyer.findById(req.params.id);
        if (!flyer) return res.status(404).json({ error: 'Flyer not found' });
        
        // Delete all items associated with this flyer
        await Item.deleteMany({ flyer: flyer._id });
        
        // Delete the flyer
        await flyer.remove();
        
        res.status(200).json({ message: 'Flyer and associated items deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};