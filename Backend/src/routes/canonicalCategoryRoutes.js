const express = require('express');
const router = express.Router();
const canonicalCategoryController = require('../controllers/canonicalCategoryController');

router.get('/', canonicalCategoryController.getCanonicalCategories);
router.get('/search', canonicalCategoryController.getCanonicalCategories);
router.get('/ids', canonicalCategoryController.getCanonicalCategoriesByIds);

module.exports = router;