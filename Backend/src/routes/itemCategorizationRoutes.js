const express = require('express');
const router = express.Router();
const itemCategorizationController = require('../controllers/itemCategorizationController');

router.post('/', itemCategorizationController.createItemCategorization);
router.get('/', itemCategorizationController.getItemCategorizations);
router.get('/item/:itemId', itemCategorizationController.getItemCategorizationsByItem);
router.delete('/:id', itemCategorizationController.deleteItemCategorization);

module.exports = router;