const express = require('express');
const router = express.Router();
const {
  saveSession,
  getSessionById,
  getSessions,
} = require('../controllers/tutorController');

router.post('/sessions', saveSession);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionById);

module.exports = router;
