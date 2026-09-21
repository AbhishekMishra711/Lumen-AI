const axios = require('axios');

const SARVAM_API_URL = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_MODEL = process.env.SARVAM_MODEL || 'sarvam-105b-conversations';
const SARVAM_AI_API_KEY = process.env.SARVAM_AI_API_KEY;

/**
 * Generate quiz questions for a given topic
 */
const generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Generate questions using SARVAM AI
    const questions = await generateQuestions(topic);

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz questions'
    });
  }
};

/**
 * Generate quiz questions using SARVAM AI
 */
const generateQuestions = async (topic) => {
  try {
    if (!SARVAM_AI_API_KEY || SARVAM_AI_API_KEY === 'your_sarvam_ai_api_key_here') {
      console.log('SARVAM API key not configured, using mock questions');
      return generateMockQuestions(topic);
    }

    console.log('Using SARVAM API to generate questions for topic:', topic);
    const prompt = `Generate 5 multiple choice questions about "${topic}" for a learning quiz. Return as JSON array with structure: [{"id": "1", "question": "question text", "options": ["option1", "option2", "option3", "option4"], "correctAnswer": 0, "explanation": "explanation"}]`;

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
      max_tokens: 1500
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
    },
    {
      id: "4",
      question: `Which of the following best describes ${topic}?`,
      options: [
        "A theoretical concept with no practical use",
        "A practical tool for solving problems",
        "An outdated methodology",
        "A complex system with no benefits"
      ],
      correctAnswer: 1,
      explanation: `${topic} is a practical tool designed to solve real-world problems effectively.`
    },
    {
      id: "5",
      question: `What is a key benefit of using ${topic}?`,
      options: [
        "It increases complexity unnecessarily",
        "It simplifies complex problems",
        "It requires more time to learn",
        "It has no real benefits"
      ],
      correctAnswer: 1,
      explanation: `${topic} simplifies complex problems and makes them more manageable.`
    }
  ];
};

module.exports = {
  generateQuiz
};