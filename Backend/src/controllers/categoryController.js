const Category = require('../models/categoryModel');
const ItemCategorization = require('../models/itemCategorizationModel');

exports.createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find(req.query)
            .populate({ path: 'items', match: { item_id: { $exists: true } }, localField: 'items', foreignField: 'item_id' })
            .limit(1000000);

        // Filter out categories where items field is an empty list
        const filteredCategories = categories.filter(category => category.items && category.items.length > 0);
        res.status(200).json(filteredCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.searchCategories = async (req, res) => {
    try {
        const categories = await Category.find({
            $or: [
                { name: { $regex: req.query.q, $options: 'i' } },
                { 'items.name': { $regex: req.query.q, $options: 'i' } }
            ]
        })
        .populate({ path: 'items', match: { name: { $regex: req.query.q, $options: 'i' } }, localField: 'items', foreignField: 'item_id' })
        .limit(1000000);

        // Filter out categories where items field is an empty list
        const filteredCategories = categories.filter(category => category.items && category.items.length > 0);
        res.status(200).json(filteredCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.getFavoriteCategories = async (req, res) => {
    try {
        const { categoryIds } = req.body;
        if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ error: 'Invalid categoryIds' });
        }

        const categories = await Category.find({ _id: { $in: categoryIds } })
            .populate({ path: 'items', match: { item_id: { $exists: true } }, localField: 'items', foreignField: 'item_id' });

        // Filter out categories where items field is an empty list
        const filteredCategories = categories.filter(category => category.items && category.items.length > 0);
        res.status(200).json(filteredCategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentCategory');
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubcategories = async (req, res) => {
    try {
        const subcategories = await Category.find({ parentCategory: req.params.id });
        res.status(200).json(subcategories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });
        
        // Update subcategories to remove parent reference
        await Category.updateMany(
            { parentCategory: category._id },
            { $unset: { parentCategory: 1 } }
        );
        
        // Delete related categorizations
        await ItemCategorization.deleteMany({ category: category._id });
        
        // Delete the category
        await category.remove();
        
        res.status(200).json({ message: 'Category and related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};