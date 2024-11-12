const Item = require('../models/itemModel');
const ItemCategorization = require('../models/itemCategorizationModel');
const mongoose = require('mongoose');

exports.createItem = async (req, res) => {
    try {
        const item = new Item(req.body);
        await item.save();
        
        // Add item to flyer's items array
        if (item.flyer) {
            await Flyer.findByIdAndUpdate(
                item.flyer,
                { $push: { items: item._id } }
            );
        }
        
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        console.log('Database connection:', mongoose.connection.name); // Log database name
        console.log('Collection:', Item.collection.name); // Log collection name
        
        const items = await Item.find(req.query)
            .populate('category')
            .populate('flyer');
            
        console.log('Query results:', items.length); // Log number of items found
        
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getItemsByFlyer = async (req, res) => {
    try {
        const items = await Item.find({ flyer: req.params.flyerId })
            .populate('category')
            .populate('flyer');
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.status(200).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        // Remove item from flyer's items array
        if (item.flyer) {
            await Flyer.findByIdAndUpdate(
                item.flyer,
                { $pull: { items: item._id } }
            );
        }
        
        // Delete related categorizations
        await ItemCategorization.deleteMany({ item: item._id });
        
        // Delete the item
        await item.remove();
        
        res.status(200).json({ message: 'Item and related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};