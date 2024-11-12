const ItemCategorization = require('../models/itemCategorizationModel');

exports.createItemCategorization = async (req, res) => {
    try {
        const categorization = new ItemCategorization(req.body);
        await categorization.save();
        res.status(201).json(categorization);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getItemCategorizations = async (req, res) => {
    try {
        const categorizations = await ItemCategorization.find(req.query)
            .populate('item')
            .populate('category');
        res.status(200).json(categorizations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getItemCategorizationsByItem = async (req, res) => {
    try {
        const categorizations = await ItemCategorization.find({ item: req.params.itemId })
            .populate('category');
        res.status(200).json(categorizations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteItemCategorization = async (req, res) => {
    try {
        const categorization = await ItemCategorization.findById(req.params.id);
        if (!categorization) return res.status(404).json({ error: 'Categorization not found' });
        
        await categorization.remove();
        res.status(200).json({ message: 'Categorization deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};