const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  generateFlashcards,
  saveDeck,
  getDecks,
  getDeckById,
  deleteDeck,
} = require('../controllers/flashcardController');

// Multer upload setup
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.md'];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type (${ext}). Allowed formats: PDF, DOCX, PPTX, TXT`));
    }
  },
});

// Flashcard Generation
router.post('/generate', upload.array('files', 10), generateFlashcards);

// Flashcard Deck Persistence (MongoDB)
router.post('/decks', saveDeck);
router.get('/decks', getDecks);
router.get('/decks/:id', getDeckById);
router.delete('/decks/:id', deleteDeck);

// Legacy wrappers for backward compatibility
router.post('/upload', upload.single('file'), (req, res, next) => {
  req.url = '/generate';
  router.handle(req, res, next);
});
router.post('/youtube', (req, res, next) => {
  req.url = '/generate';
  router.handle(req, res, next);
});
router.post('/text', (req, res, next) => {
  req.url = '/generate';
  router.handle(req, res, next);
});

module.exports = router;
