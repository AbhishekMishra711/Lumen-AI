const fs = require('fs');
const path = require('path');
const FlashcardDeck = require('../models/FlashcardDeck');
const extractionService = require('../services/extractionService');
const aiService = require('../services/aiService');
const { resolveUserId } = require('../utils/authHelper');

/**
 * Generate Flashcards from File(s), YouTube, or Text Notes
 */
const generateFlashcards = async (req, res) => {
  const uploadedFiles = req.files || (req.file ? [req.file] : []);

  try {
    const { sourceType, text, url, cardCount = 10 } = req.body;
    let extractedTextParts = [];
    let detectedSource = sourceType || 'Text Input';

    // 1. File Upload Processing
    if (uploadedFiles.length > 0) {
      const fileNames = [];
      console.log(`📥 Received ${uploadedFiles.length} uploaded file(s)`);

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const filePath = file.path;
        const originalName = file.originalname;
        const ext = path.extname(originalName).toLowerCase();
        fileNames.push(originalName);

        let fileText = '';
        if (ext === '.pdf') {
          fileText = await extractionService.extractTextFromPDF(filePath);
        } else if (ext === '.docx' || ext === '.doc') {
          fileText = await extractionService.extractTextFromWord(filePath);
        } else if (ext === '.pptx' || ext === '.ppt') {
          fileText = await extractionService.extractTextFromPPTX(filePath);
        } else {
          fileText = fs.readFileSync(filePath, 'utf-8');
        }

        if (fileText && fileText.trim().length > 10) {
          extractedTextParts.push(`=== DOCUMENT ${i + 1}: ${originalName} ===\n${fileText.trim()}`);
        }

        fs.unlink(filePath, () => {});
      }

      detectedSource = `Files (${fileNames.join(', ')})`;
    }
    // 2. YouTube Link Processing
    else if (url && url.trim().length > 0) {
      console.log(`📥 Received YouTube URL: ${url}`);
      const ytText = await extractionService.extractYouTubeTranscript(url);
      extractedTextParts.push(ytText);
      detectedSource = 'YouTube Video Transcript';
    }
    // 3. Raw Text / Prompt Processing
    else if (text && text.trim().length > 0) {
      console.log(`📥 Received raw text input (${text.length} characters)`);
      extractedTextParts.push(text.trim());
      detectedSource = 'Text Notes / Prompt';
    } else {
      return res.status(400).json({
        error: 'No input provided. Please upload document(s) (PDF, DOCX, PPTX), enter a YouTube link, or paste text/prompt.'
      });
    }

    const combinedText = extractedTextParts.join('\n\n');

    if (!combinedText || combinedText.trim().length < 15) {
      return res.status(400).json({
        error: 'Sufficient learning text could not be extracted from the provided source(s). Please check your files or link.'
      });
    }

    console.log(`📊 Processing ${combinedText.length} characters extracted from ${detectedSource}...`);

    const count = parseInt(cardCount, 10) || 10;
    const flashcardResult = await aiService.generateFlashcardsWithSarvam(combinedText, detectedSource, count);

    return res.json({
      success: true,
      sourceType: detectedSource,
      textCharCount: combinedText.length,
      fileCount: uploadedFiles.length,
      ...flashcardResult
    });

  } catch (error) {
    console.error('❌ Flashcard Generation Error:', error);

    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(f => {
        if (f.path && fs.existsSync(f.path)) fs.unlink(f.path, () => {});
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to process request and generate flashcards.',
      details: error.message
    });
  }
};

/**
 * Save Generated Flashcard Deck into MongoDB
 */
const saveDeck = async (req, res) => {
  try {
    const { title, summary, sourceType, flashcards, userId, isFallback } = req.body;

    if (!title || !flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return res.status(400).json({ error: 'Title and flashcards array are required' });
    }

    const effectiveUserId = resolveUserId(req) || userId || null;

    const newDeck = await FlashcardDeck.create({
      title: title.trim(),
      summary: summary || '',
      sourceType: sourceType || 'Custom',
      totalCards: flashcards.length,
      flashcards,
      userId: effectiveUserId,
      isFallback: Boolean(isFallback),
    });

    console.log(`💾 Flashcard Deck saved to MongoDB: "${newDeck.title}" (User: ${effectiveUserId || 'anonymous'}, ID: ${newDeck._id})`);

    return res.status(201).json({
      success: true,
      message: 'Flashcard deck saved to MongoDB successfully',
      deck: newDeck,
    });
  } catch (error) {
    console.error('Error saving deck to MongoDB:', error);
    return res.status(500).json({ error: 'Failed to save flashcard deck', details: error.message });
  }
};

/**
 * Get all Saved Decks from MongoDB
 */
const getDecks = async (req, res) => {
  try {
    const effectiveUserId = req.query.userId || resolveUserId(req);
    const query = {};
    if (effectiveUserId && effectiveUserId !== 'all') {
      query.$or = [{ userId: effectiveUserId }, { userId: null }];
    }

    const decks = await FlashcardDeck.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.json({
      success: true,
      count: decks.length,
      decks,
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return res.status(500).json({ error: 'Failed to retrieve flashcard decks', details: error.message });
  }
};

/**
 * Get single Deck by ID from MongoDB
 */
const getDeckById = async (req, res) => {
  try {
    const deck = await FlashcardDeck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Flashcard deck not found' });
    }
    return res.json({ success: true, deck });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deck', details: error.message });
  }
};

/**
 * Delete a Deck from MongoDB
 */
const deleteDeck = async (req, res) => {
  try {
    const deleted = await FlashcardDeck.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Flashcard deck not found' });
    }
    return res.json({ success: true, message: 'Flashcard deck deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete deck', details: error.message });
  }
};

module.exports = {
  generateFlashcards,
  saveDeck,
  getDecks,
  getDeckById,
  deleteDeck,
};
