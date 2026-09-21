const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../controllers/quizController');

// Quiz generation endpoint
router.post('/generate', generateQuiz);

console.log('Quiz routes loaded successfully');

module.exports = router;