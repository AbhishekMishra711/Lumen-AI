const TutorSession = require('../models/TutorSession');

/**
 * Save AI Tutor session to MongoDB
 */
const saveSession = async (req, res) => {
  try {
    const { userId, title, sourceType, sourceContent, curriculum } = req.body;

    if (!title || !sourceType || !curriculum) {
      return res.status(400).json({ error: 'Title, sourceType, and curriculum are required' });
    }

    const session = await TutorSession.create({
      userId: userId || null,
      title: title.trim(),
      sourceType,
      sourceContent: sourceContent || '',
      curriculum,
    });

    console.log(`💾 Tutor session saved to MongoDB: "${session.title}" (ID: ${session._id})`);

    return res.status(201).json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        sourceType: session.sourceType,
        curriculum: session.curriculum,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Error saving tutor session:', error);
    return res.status(500).json({ error: 'Failed to save tutor session', details: error.message });
  }
};

/**
 * Get Tutor Session by ID from MongoDB
 */
const getSessionById = async (req, res) => {
  try {
    const session = await TutorSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Tutor session not found' });
    }

    return res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        sourceType: session.sourceType,
        curriculum: session.curriculum,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tutor session:', error);
    return res.status(500).json({ error: 'Failed to fetch session', details: error.message });
  }
};

/**
 * List all tutor sessions
 */
const getSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = {};
    if (userId) query.userId = userId;

    const sessions = await TutorSession.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s._id,
        title: s.title,
        sourceType: s.sourceType,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
};

module.exports = {
  saveSession,
  getSessionById,
  getSessions,
};
