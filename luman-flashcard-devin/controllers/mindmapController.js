const fs = require('fs');
const MindMap = require('../models/MindMap');
const mindmapService = require('../services/mindmapService');
const { resolveUserId } = require('../utils/authHelper');

/**
 * Generate Mind Map from PDF or Text Input
 */
const generateMindMap = async (req, res) => {
  const uploadedFile = req.file;

  try {
    let text = '';
    let sourceName = 'Text Notes';

    if (uploadedFile) {
      sourceName = uploadedFile.originalname;
      console.log(`📄 Extracting text from uploaded PDF for Mind Map: ${sourceName}`);
      text = await mindmapService.extractTextFromPDF(uploadedFile.path);
      fs.unlink(uploadedFile.path, () => {});
    } else if ((req.body.text || req.body.topic || req.body.prompt) && (req.body.text || req.body.topic || req.body.prompt).trim()) {
      text = (req.body.text || req.body.topic || req.body.prompt).trim();
      sourceName = req.body.title || req.body.topic || 'Study Prompt';
      console.log(`📝 Generating Mind Map from text prompt (${text.length} chars)`);
    } else {
      return res.status(400).json({ error: 'Please upload a PDF or enter study text/topic prompt.' });
    }

    if (!text || text.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a topic name with at least 2 characters.' });
    }

    const hierarchy = await mindmapService.generateMindMapHierarchy(text, sourceName);
    const flowData = mindmapService.convertToFlowFormat(hierarchy);

    return res.json({
      success: true,
      title: hierarchy.root?.label || sourceName,
      sourceName,
      hierarchy,
      flowData,
    });
  } catch (error) {
    console.error('Mind Map Generation Error:', error);
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      fs.unlink(uploadedFile.path, () => {});
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to generate mind map.',
      details: error.message,
    });
  }
};

/**
 * Save Mind Map to MongoDB Atlas
 */
const saveMindMap = async (req, res) => {
  try {
    const { title, sourceName, hierarchy, flowData, userId } = req.body;

    if (!title || !hierarchy) {
      return res.status(400).json({ error: 'Title and hierarchy are required' });
    }

    const effectiveUserId = resolveUserId(req) || userId || null;

    const newMap = await MindMap.create({
      title: title.trim(),
      sourceName: sourceName || 'Document',
      hierarchy,
      flowData: flowData || null,
      userId: effectiveUserId,
    });

    console.log(`💾 Mind Map saved to MongoDB: "${newMap.title}" (User: ${effectiveUserId || 'anonymous'}, ID: ${newMap._id})`);

    return res.status(201).json({
      success: true,
      message: 'Mind Map saved to MongoDB successfully',
      mindMap: newMap,
      data: newMap,
    });
  } catch (error) {
    console.error('Error saving mind map to MongoDB:', error);
    return res.status(500).json({ error: 'Failed to save mind map', details: error.message });
  }
};

/**
 * Get all Saved Mind Maps from MongoDB Atlas
 */
const getMindMaps = async (req, res) => {
  try {
    const effectiveUserId = req.query.userId || resolveUserId(req);
    const query = {};
    if (effectiveUserId && effectiveUserId !== 'all') {
      query.$or = [{ userId: effectiveUserId }, { userId: null }];
    }

    const maps = await MindMap.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    return res.json({
      success: true,
      count: maps.length,
      mindMaps: maps,
      data: maps,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve mind maps', details: error.message });
  }
};

/**
 * Get single Mind Map by ID from MongoDB Atlas
 */
const getMindMapById = async (req, res) => {
  try {
    const map = await MindMap.findById(req.params.id);
    if (!map) {
      return res.status(404).json({ error: 'Mind map not found' });
    }
    return res.json({ success: true, mindMap: map });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch mind map', details: error.message });
  }
};

/**
 * Delete a Mind Map from MongoDB Atlas
 */
const deleteMindMap = async (req, res) => {
  try {
    const deleted = await MindMap.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Mind map not found' });
    }
    return res.json({ success: true, message: 'Mind map deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete mind map', details: error.message });
  }
};

module.exports = {
  generateMindMap,
  saveMindMap,
  getMindMaps,
  getMindMapById,
  deleteMindMap,
};
