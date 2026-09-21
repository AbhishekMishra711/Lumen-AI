const axios = require('axios');
const { resolveUserId } = require('../utils/authHelper');

const SARVAM_API_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_MODEL = process.env.SARVAM_MODEL || 'sarvam-105b-conversations';
const SARVAM_AI_API_KEY = process.env.SARVAM_AI_API_KEY;

/**
 * Get dashboard statistics including streak, study hours, strengths, weaknesses
 */
const getDashboardStats = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    
    // Mock data for now - in production, this would come from MongoDB
    const stats = {
      currentStreak: 5,
      totalHours: 48,
      weeklyHours: 12,
      strengths: [
        'Problem Solving',
        'Algorithm Design',
        'Data Structures'
      ],
      weaknesses: [
        'Time Management',
        'Advanced Mathematics',
        'System Design'
      ],
      workOnItems: [
        'Practice LeetCode daily',
        'Review System Design patterns',
        'Work on time management'
      ]
    };

    // If user is logged in, you could fetch their actual data from MongoDB
    if (userId) {
      // TODO: Implement actual data fetching from MongoDB
      // const user = await User.findById(userId);
      // Update stats with real user data
    }

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

/**
 * Ask a question to the AI tutor using Sarvam AI
 */
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    if (!SARVAM_AI_API_KEY || SARVAM_AI_API_KEY === 'your_sarvam_ai_api_key_here') {
      // Fallback response if API key is not configured
      return res.json({
        success: true,
        answer: `I understand you're asking about: "${question}"\n\nTo get AI-powered responses, please configure your Sarvam AI API key in the backend environment variables. For now, I'm operating in demo mode.\n\nIn a fully configured setup, I would provide detailed explanations, examples, and study guidance based on your question.`
      });
    }

    const response = await axios.post(SARVAM_API_URL, {
      model: SARVAM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI study assistant. Provide clear, concise, and educational responses to help students learn effectively. Use examples and explanations that make complex topics easier to understand.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SARVAM_AI_API_KEY}`
      }
    });

    const answer = response.data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('AI question error:', error);
    
    // Fallback response in case of API errors
    res.json({
      success: true,
      answer: `I encountered an error while processing your question: "${question}"\n\nError details: ${error.message}\n\nPlease try again or check your API configuration.`
    });
  }
};

module.exports = {
  getDashboardStats,
  askQuestion
};