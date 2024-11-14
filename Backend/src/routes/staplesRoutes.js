const express = require('express');
const router = express.Router();
const staplesController = require('../controllers/staplesController');

router.get('/', staplesController.getStaples);
router.get('', staplesController.getStaples);

module.exports = router;