const axios = require('axios');

const SARVAM_API_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_MODEL = process.env.SARVAM_MODEL || 'sarvam-105b-conversations';
const SARVAM_AI_API_KEY = process.env.SARVAM_AI_API_KEY;

/**
 * Generate memory palace content from various input types
 */
const generateMemoryPalace = async (req, res) => {
  try {
    const { content, type } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // For demo purposes, generate content based on the input
    let topic = content;
    if (type === 'youtube') {
      // Extract video ID or use URL as topic
      topic = content.includes('youtube.com') ? 'YouTube Video Content' : content;
    } else if (type === 'pdf') {
      topic = content.replace(/\.[^/.]+$/, '') || 'PDF Document';
    }

    // Generate concepts and questions using SARVAM AI
    const concepts = await generateConcepts(topic);
    const questions = await generateQuestions(topic);

    res.json({
      success: true,
      concepts,
      questions
    });
  } catch (error) {
    console.error('Memory palace generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate memory palace content'
    });
  }
};

/**
 * Generate learning concepts for the memory palace chambers
 */
const generateConcepts = async (topic) => {
  try {
    if (!SARVAM_AI_API_KEY || SARVAM_AI_API_KEY === 'your_sarvam_ai_api_key_here') {
      console.log('SARVAM API key not configured, using mock concepts');
      return generateMockConcepts(topic);
    }

    console.log('Using SARVAM API to generate concepts for topic:', topic);
    const prompt = `Generate 3 key learning concepts about "${topic}" for a memory palace learning game. Return as JSON array with structure: [{"id": "1", "title": "concept name", "description": "detailed explanation", "keyPoints": ["point1", "point2", "point3"]}]`;

    const response = await axios.post(SARVAM_API_URL, {
      model: SARVAM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an educational content generator. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SARVAM_AI_API_KEY}`
      }
    });

    console.log('SARVAM API response status:', response.status);
    const content = response.data.choices?.[0]?.message?.content || '';
    console.log('SARVAM API response content:', content);
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedConcepts = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed SARVAM AI concepts');
        return parsedConcepts;
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      console.log('AI response content:', content);
    }

    console.log('Falling back to mock concepts due to parsing failure');
    return generateMockConcepts(topic);
  } catch (error) {
    console.error('Error generating concepts with SARVAM API:', error);
    console.log('Falling back to mock concepts due to API error');
    return generateMockConcepts(topic);
  }
};

/**
 * Generate quiz questions for the memory palace
 */
const generateQuestions = async (topic) => {
  try {
    if (!SARVAM_AI_API_KEY || SARVAM_AI_API_KEY === 'your_sarvam_ai_api_key_here') {
      console.log('SARVAM API key not configured, using mock questions');
      return generateMockQuestions(topic);
    }

    console.log('Using SARVAM API to generate questions for topic:', topic);
    const prompt = `Generate 3 multiple choice questions about "${topic}" for a learning game. Return as JSON array with structure: [{"id": "1", "question": "question text", "options": ["option1", "option2", "option3", "option4"], "correctAnswer": 0, "explanation": "explanation"}]`;

    const response = await axios.post(SARVAM_API_URL, {
      model: SARVAM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an educational content generator. Always respond with valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SARVAM_AI_API_KEY}`
      }
    });

    console.log('SARVAM API response status:', response.status);
    const content = response.data.choices?.[0]?.message?.content || '';
    console.log('SARVAM API response content:', content);
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed SARVAM AI questions');
        return parsedQuestions;
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      console.log('AI response content:', content);
    }

    console.log('Falling back to mock questions due to parsing failure');
    return generateMockQuestions(topic);
  } catch (error) {
    console.error('Error generating questions with SARVAM API:', error);
    console.log('Falling back to mock questions due to API error');
    return generateMockQuestions(topic);
  }
};

/**
 * Generate mock concepts for demo/fallback
 */
const generateMockConcepts = (topic) => {
  return [
    {
      id: "1",
      title: `Introduction to ${topic}`,
      description: `This is the foundational concept of ${topic}. Understanding the basics is crucial for building advanced knowledge. We'll explore the core principles and key terminology that form the backbone of this subject.`,
      keyPoints: [
        `Core definition of ${topic}`,
        "Key terminology and concepts",
        "Historical context and importance"
      ]
    },
    {
      id: "2",
      title: `${topic} - Key Components`,
      description: `The main components of ${topic} work together to create a comprehensive system. Each component plays a specific role and understanding their interactions is essential for mastery.`,
      keyPoints: [
        "Primary components and their functions",
        "Component interactions and dependencies",
        "Common patterns and best practices"
      ]
    },
    {
      id: "3",
      title: `Advanced ${topic} Applications`,
      description: `Once you understand the basics, you can explore advanced applications of ${topic}. This includes real-world scenarios, optimization techniques, and specialized use cases.`,
      keyPoints: [
        "Real-world applications and use cases",
        "Advanced techniques and optimizations",
        "Common challenges and solutions"
      ]
    }
  ];
};

/**
 * Generate mock questions for demo/fallback
 */
const generateMockQuestions = (topic) => {
  return [
    {
      id: "1",
      question: `What is the primary purpose of ${topic}?`,
      options: [
        "To create confusion",
        "To solve specific problems efficiently",
        "To increase complexity",
        "To replace all other methods"
      ],
      correctAnswer: 1,
      explanation: `The primary purpose of ${topic} is to solve specific problems efficiently and effectively.`
    },
    {
      id: "2",
      question: `Which of the following is a key component of ${topic}?`,
      options: [
        "Random elements with no purpose",
        "Structured components with specific functions",
        "Unorganized data",
        "Optional features only"
      ],
      correctAnswer: 1,
      explanation: `${topic} relies on structured components with specific functions to work effectively.`
    },
    {
      id: "3",
      question: `What is a common application of ${topic}?`,
      options: [
        "Creating unnecessary complexity",
        "Solving real-world problems",
        "Generating random data",
        "Replacing human intelligence completely"
      ],
      correctAnswer: 1,
      explanation: `${topic} is commonly applied to solve real-world problems across various domains.`
    }
  ];
};

module.exports = {
  generateMemoryPalace
};