const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

router.post('/', scraperController.createScraperLog);
router.get('/', scraperController.getScraperLogs);
router.get('/source/:source/latest', scraperController.getLatestScraperLog);

module.exports = router;