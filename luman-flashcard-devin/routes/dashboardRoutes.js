const express = require('express');
const router = express.Router();
const { getDashboardStats, askQuestion } = require('../controllers/dashboardController');

router.get('/stats', getDashboardStats);
router.post('/ask', askQuestion);

module.exports = router;