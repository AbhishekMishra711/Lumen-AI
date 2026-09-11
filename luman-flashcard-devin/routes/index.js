const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const flashcardRoutes = require('./flashcardRoutes');
const tutorRoutes = require('./tutorRoutes');
const mindmapRoutes = require('./mindmapRoutes');

// Active Feature Modules
router.use('/auth', authRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/tutor', tutorRoutes);
router.use('/mindmap', mindmapRoutes);
router.use('/upload-pdf', mindmapRoutes); // Direct root compatibility alias for lomen-mindmap

// Health & System Info
router.get('/health', (req, res) => {
  const dbStatus = require('../config/db').isConnected();
  const hasSarvam = Boolean(process.env.SARVAM_AI_API_KEY && process.env.SARVAM_AI_API_KEY !== 'your_sarvam_ai_api_key_here');

  res.json({
    status: 'online',
    message: 'Luman AI Backend API is operational',
    database: {
      type: 'MongoDB',
      connected: dbStatus,
    },
    features: {
      flashcards: 'active',
      mindmap: 'active',
      tutor: 'active',
      auth: 'active',
      quiz: 'ready_for_expansion',
      memory_palace: 'ready_for_expansion',
    },
    sarvamConfigured: hasSarvam,
  });
});

// Future Feature Hook Points (ready to be plugged in seamlessly)
// router.use('/quiz', require('./quizRoutes'));
// router.use('/memory-palace', require('./memoryPalaceRoutes'));

module.exports = router;
