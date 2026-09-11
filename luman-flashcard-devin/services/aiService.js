const axios = require('axios');
const crypto = require('crypto');

// In-Memory Cache to save Sarvam AI API credits
const flashcardCache = new Map();

function generateCacheKey(text, count = 10) {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(`${normalized.substring(0, 2000)}_${normalized.length}_${count}`).digest('hex');
}

/**
 * Intelligent Local Extractive & Domain Fallback Engine
 * Generates rich active recall cards when Sarvam AI key is absent, throttled, or offline
 */
function generateLocalFallbackFlashcards(text, count = 10) {
  console.log('🔄 Running Local Fallback Engine for flashcards...');

  const topicQuery = text.trim().toLowerCase();
  const flashcards = [];

  // Domain fallback for Machine Learning / AI
  if (topicQuery.includes('machine learning') || topicQuery.includes('ml') || topicQuery.includes('artificial intelligence')) {
    const mlConcepts = [
      { q: "What is Machine Learning?", a: "A branch of artificial intelligence focused on building systems that learn from data to improve performance without explicit programming.", cat: "Foundations" },
      { q: "What is the difference between Supervised and Unsupervised Learning?", a: "Supervised learning trains models on labeled input-output pairs. Unsupervised learning analyzes unlabeled data to uncover hidden structures and patterns.", cat: "Learning Paradigms" },
      { q: "What is Overfitting and how can it be prevented?", a: "Overfitting occurs when a model fits training noise instead of general patterns. It is prevented using regularization, cross-validation, and dropout.", cat: "Model Evaluation" },
      { q: "What is the Bias-Variance Tradeoff?", a: "The balance between underfitting (high bias, model too simple) and overfitting (high variance, model too complex).", cat: "Model Design" },
      { q: "What is Gradient Descent?", a: "An optimization algorithm that iteratively adjusts model weights to minimize the cost or loss function.", cat: "Optimization" },
      { q: "What is a Neural Network?", a: "A computational model inspired by the biological brain, consisting of interconnected node layers that process complex non-linear data.", cat: "Deep Learning" },
      { q: "What is Cross-Validation?", a: "A statistical resampling technique that splits data into multiple folds to evaluate generalization accuracy.", cat: "Validation" },
      { q: "What is Classification versus Regression?", a: "Classification predicts discrete categorical labels (e.g. Spam/Not Spam), whereas Regression predicts continuous numerical values.", cat: "Tasks" },
      { q: "What is a Loss Function?", a: "A mathematical function measuring the discrepancy between a model's predicted output and the actual target label.", cat: "Optimization" },
      { q: "What is Reinforcement Learning?", a: "A paradigm where an autonomous agent learns optimal actions in an environment through trial-and-error rewards and penalties.", cat: "Paradigms" }
    ];

    for (let i = 0; i < Math.min(count, mlConcepts.length); i++) {
      flashcards.push({
        id: i + 1,
        question: mlConcepts[i].q,
        answer: mlConcepts[i].a,
        category: mlConcepts[i].cat,
        difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
        keyPoints: [mlConcepts[i].cat, 'Core Machine Learning Concept']
      });
    }

    return {
      title: "Machine Learning Core Concepts",
      summary: "Comprehensive flashcards covering fundamental paradigms, algorithms, and optimization techniques.",
      flashcards: flashcards,
      isFallback: true
    };
  }

  // General text extraction fallback for any document or text
  const cleanedText = text.replace(/=== DOCUMENT \d+:[^=]+===/g, '').replace(/\s+/g, ' ');
  const sentences = cleanedText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 250);

  const totalCards = Math.min(count, Math.max(3, sentences.length));

  for (let i = 0; i < totalCards && i < sentences.length; i++) {
    const sentence = sentences[i];
    let conceptTerm = sentence.split(' ').slice(0, 4).join(' ');
    let question = `Explain the concept: "${conceptTerm}..."`;
    let answer = sentence;
    let category = 'Core Concept';

    if (sentence.includes(' is ') || sentence.includes(' refers to ') || sentence.includes(' defined as ')) {
      const parts = sentence.split(/ is | refers to | defined as /);
      if (parts.length >= 2 && parts[0].length < 60) {
        conceptTerm = parts[0].trim().replace(/^[-•*0-9.]+\s*/, '');
        question = `What is ${conceptTerm}?`;
        answer = `${conceptTerm} ${sentence.includes(' is ') ? 'is' : sentence.includes(' refers to ') ? 'refers to' : 'is defined as'} ${parts.slice(1).join(' ')}`;
        category = 'Definition';
      }
    }

    flashcards.push({
      id: i + 1,
      question: question,
      answer: answer,
      category: category,
      difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
      keyPoints: [sentence.substring(0, 65) + '...', 'Key Study Point']
    });
  }

  if (flashcards.length === 0) {
    flashcards.push({
      id: 1,
      question: `What are the primary concepts covered in "${text.substring(0, 40)}..."?`,
      answer: text.trim(),
      category: "Main Topic",
      difficulty: "medium",
      keyPoints: ["Source Content Overview"]
    });
  }

  return {
    title: 'Study Concept Flashcards',
    summary: 'Flashcards generated from core concepts in your study material.',
    flashcards: flashcards,
    isFallback: true
  };
}

/**
 * Generate Flashcards using Sarvam AI Chat Completion API
 */
async function generateFlashcardsWithSarvam(text, sourceType = 'Content', cardCount = 10) {
  const apiKey = process.env.SARVAM_AI_API_KEY;
  const isKeyValid = apiKey && apiKey !== 'your_sarvam_ai_api_key_here' && apiKey.trim().length > 5;

  if (!isKeyValid) {
    console.warn('⚠️ Sarvam AI API key is not configured in .env. Using intelligent local fallback generator.');
    return generateLocalFallbackFlashcards(text, cardCount);
  }

  const trimmedText = text.length > 8000 ? text.substring(0, 8000) + '\n[Source truncated for optimal token length]' : text;

  // Check In-Memory Cache
  const cacheKey = generateCacheKey(trimmedText, cardCount);
  if (flashcardCache.has(cacheKey)) {
    console.log('⚡ Returning cached flashcards (Saved Sarvam AI credits)!');
    const cachedData = flashcardCache.get(cacheKey);
    return { ...cachedData, cached: true };
  }

  const systemPrompt = `You are a world-class STEM professor and educational curriculum specialist. 
Your output MUST be strictly in clear, professional ENGLISH only. Do NOT generate Hindi or non-English text. Output strictly valid JSON.`;

  const userPrompt = `Create exactly ${cardCount} high-yield active recall flashcards based on the provided material (${sourceType}) and your deep domain knowledge on the topic.

Source Content / Prompt:
${trimmedText}

Strict Generation Rules:
1. HYBRID KNOWLEDGE EXPANSION: Use both the provided source text AND your deep AI domain knowledge. If the source text is short (e.g. "what is machine learning"), expand it into a comprehensive, high-yield ${cardCount}-card study set covering core principles, algorithms, definitions, and practical applications.
2. ENGLISH LANGUAGE ONLY: Write ALL questions, answers, categories, and key points in English.
3. HIGH-YIELD ACTIVE RECALL: Formulate precise questions that test understanding.
4. ACCURATE & COMPREHENSIVE ANSWERS: Provide clear, 2-3 sentence scientifically accurate answers.
5. STRICT JSON OUTPUT ONLY: Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Topic / Subject Title in English",
  "summary": "2-sentence high-yield summary of the learning material in English",
  "flashcards": [
    {
      "id": 1,
      "question": "Clear, specific active recall question?",
      "answer": "Accurate, self-contained 2-sentence answer.",
      "category": "Subtopic area",
      "difficulty": "easy | medium | hard",
      "keyPoints": ["Takeaway point 1", "Takeaway point 2"]
    }
  ]
}`;

  const apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/v1/chat/completions';
  const modelName = process.env.SARVAM_MODEL || 'sarvam-105b-conversations';

  try {
    console.log(`🚀 Sending request to Sarvam AI API (${apiUrl}) using model '${modelName}'...`);

    const response = await axios.post(
      apiUrl,
      {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        timeout: 65000
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content || '';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Sarvam AI response did not contain a valid JSON object structure.');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    if (!parsedData.flashcards || !Array.isArray(parsedData.flashcards)) {
      throw new Error('Parsed JSON does not contain a "flashcards" array.');
    }

    flashcardCache.set(cacheKey, parsedData);

    return {
      ...parsedData,
      cached: false,
      isFallback: false
    };

  } catch (error) {
    console.error('❌ Sarvam AI API Error:', error.response?.data || error.message);
    console.log('⚠️ Falling back to local extractive flashcard generator...');
    return generateLocalFallbackFlashcards(text, cardCount);
  }
}

module.exports = {
  generateFlashcardsWithSarvam,
  generateLocalFallbackFlashcards,
  getCacheSize: () => flashcardCache.size
};
