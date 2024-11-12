const express = require('express');
const router = express.Router();
const flyerController = require('../controllers/flyerController');

router.post('/', flyerController.createFlyer);
router.get('/', flyerController.getFlyers);
router.get('/:id', flyerController.getFlyerById);
router.put('/:id', flyerController.updateFlyer);
router.delete('/:id', flyerController.deleteFlyer);

module.exports = router;