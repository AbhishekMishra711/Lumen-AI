const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  generateMindMap,
  saveMindMap,
  getMindMaps,
  getMindMapById,
  deleteMindMap,
} = require('../controllers/mindmapController');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Generation
router.post('/', upload.single('file'), generateMindMap);
router.post('/generate', upload.single('file'), generateMindMap);
router.post('/upload-pdf', upload.single('file'), generateMindMap); // compatibility alias

// MongoDB Atlas Persistence
router.post('/save', saveMindMap);
router.get('/', getMindMaps);
router.get('/:id', getMindMapById);
router.delete('/:id', deleteMindMap);

module.exports = router;
