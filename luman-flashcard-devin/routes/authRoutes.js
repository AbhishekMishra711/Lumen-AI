const express = require('express');
const router = express.Router();
const { register, login, getMe, updateClass } = require('../controllers/authController');

router.post('/signup', register);
router.post('/login', login);
router.get('/me', getMe);
router.post('/class', updateClass);

module.exports = router;
