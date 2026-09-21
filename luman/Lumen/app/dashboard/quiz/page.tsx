"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

type QuizState = "loading" | "playing" | "results";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function Quiz() {
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [topic, setTopic] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleStartQuiz = async () => {
    if (!inputValue.trim()) return;
    
    setQuizState("loading");
    setTopic(inputValue);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topic: inputValue }),
      });

      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setCurrentQuestion(0);
        setScore(0);
        setUserAnswers([]);
        setShowExplanation(false);
        setSelectedAnswer(null);
        setQuizState("playing");
      } else {
        alert("Failed to generate quiz. Please try again.");
        setQuizState("loading");
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      // Use mock data for demo
      const mockQuestions: Question[] = [
        {
          id: "1",
          question: `What is the primary purpose of ${inputValue}?`,
          options: [
            "To create confusion",
            "To solve specific problems efficiently",
            "To increase complexity",
            "To replace all other methods"
          ],
          correctAnswer: 1,
          explanation: `The primary purpose of ${inputValue} is to solve specific problems efficiently and effectively.`
        },
        {
          id: "2",
          question: `Which of the following is a key component of ${inputValue}?`,
          options: [
            "Random elements with no purpose",
            "Structured components with specific functions",
            "Unorganized data",
            "Optional features only"
          ],
          correctAnswer: 1,
          explanation: `${inputValue} relies on structured components with specific functions to work effectively.`
        },
        {
          id: "3",
          question: `What is a common application of ${inputValue}?`,
          options: [
            "Creating unnecessary complexity",
            "Solving real-world problems",
            "Generating random data",
            "Replacing human intelligence completely"
          ],
          correctAnswer: 1,
          explanation: `${inputValue} is commonly applied to solve real-world problems across various domains.`
        }
      ];
      
      setQuestions(mockQuestions);
      setCurrentQuestion(0);
      setScore(0);
      setUserAnswers([]);
      setShowExplanation(false);
      setSelectedAnswer(null);
      setQuizState("playing");
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const currentQ = questions[currentQuestion];
    if (answerIndex === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setUserAnswers(prev => [...prev, answerIndex]);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizState("results");
    }
  };

  const handleRestart = () => {
    setQuizState("loading");
    setInputValue("");
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswers([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Navigation */}
      <nav className="w-full border-b-4 border-lumen-black bg-white sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-press-start text-xl text-black hover:opacity-80 transition-opacity">
            ← BACK TO DASHBOARD
          </Link>
          <div className="font-press-start text-sm text-black">
            QUIZ
          </div>
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto">
        {quizState === "loading" && (
          <div className="bg-white border-4 border-lumen-black shadow-brutalist-xl p-8">
            <h1 className="font-press-start text-3xl text-black mb-6">
              START YOUR QUIZ
            </h1>
            
            <div className="mb-6">
              <label className="font-mono text-sm font-bold text-black mb-2 block">
                ENTER YOUR TOPIC
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter the topic you want to quiz yourself on..."
                className="w-full border-4 border-lumen-black p-4 font-mono text-sm bg-[#F4F4F0] focus:outline-none focus:ring-4 focus:ring-lumen-yellow min-h-[150px]"
              />
            </div>

            <button
              onClick={handleStartQuiz}
              disabled={!inputValue.trim()}
              className="w-full bg-lumen-orange border-4 border-lumen-black p-4 font-press-start text-lg text-white hover:bg-lumen-yellow hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-brutalist-lg"
            >
              BEGIN QUIZ
            </button>
          </div>
        )}

        {quizState === "playing" && (
          <div className="bg-white border-4 border-lumen-black shadow-brutalist-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="font-press-start text-lg text-black">
                QUESTION {currentQuestion + 1}/{questions.length}
              </div>
              <div className="font-mono text-sm text-black">
                SCORE: {score}/{questions.length}
              </div>
            </div>

            <div className="bg-lumen-magenta border-4 border-lumen-black p-6 mb-6">
              <h2 className="font-press-start text-xl text-white mb-4">
                CHALLENGE
              </h2>
              <p className="font-mono text-sm text-white leading-relaxed">
                {questions[currentQuestion]?.question}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {questions[currentQuestion]?.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !showExplanation && handleAnswer(idx)}
                  disabled={showExplanation}
                  className={`w-full border-4 border-lumen-black p-4 font-mono text-sm text-left transition-all ${
                    showExplanation
                      ? idx === questions[currentQuestion].correctAnswer
                        ? "bg-lumen-lime"
                        : idx === selectedAnswer
                        ? "bg-red-500"
                        : "bg-gray-200"
                      : "bg-white hover:bg-lumen-yellow"
                  } ${!showExplanation ? "hover:-translate-x-1 hover:-translate-y-1" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div className="bg-gray-100 border-4 border-lumen-black p-4 mb-6">
                <h3 className="font-mono text-sm font-bold text-black mb-2">
                  EXPLANATION:
                </h3>
                <p className="font-mono text-sm text-black">
                  {questions[currentQuestion]?.explanation}
                </p>
              </div>
            )}

            {showExplanation && (
              <button
                onClick={handleNextQuestion}
                className="w-full bg-lumen-yellow border-4 border-lumen-black p-4 font-press-start text-lg text-black hover:bg-lumen-cyan transition-all shadow-brutalist-lg"
              >
                {currentQuestion < questions.length - 1 ? "NEXT QUESTION" : "SEE RESULTS"}
              </button>
            )}
          </div>
        )}

        {quizState === "results" && (
          <div className="bg-white border-4 border-lumen-black shadow-brutalist-xl p-8">
            <h1 className="font-press-start text-3xl text-black mb-6 text-center">
              QUIZ COMPLETE!
            </h1>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-lumen-lime border-4 border-lumen-black p-6 text-center">
                <div className="font-press-start text-4xl text-black mb-2">
                  {score}
                </div>
                <div className="font-mono text-sm text-black">
                  CORRECT ANSWERS
                </div>
              </div>
              <div className="bg-lumen-cyan border-4 border-lumen-black p-6 text-center">
                <div className="font-press-start text-4xl text-black mb-2">
                  {Math.round((score / questions.length) * 100)}%
                </div>
                <div className="font-mono text-sm text-black">
                  ACCURACY
                </div>
              </div>
            </div>

            <div className="bg-lumen-yellow border-4 border-lumen-black p-6 mb-8">
              <h2 className="font-press-start text-xl text-black mb-4">
                PERFORMANCE SUMMARY
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-sm text-black">
                  <span>Topic:</span>
                  <span>{topic}</span>
                </div>
                <div className="flex justify-between font-mono text-sm text-black">
                  <span>Questions Answered:</span>
                  <span>{questions.length}</span>
                </div>
                <div className="flex justify-between font-mono text-sm text-black">
                  <span>Correct Answers:</span>
                  <span>{score}</span>
                </div>
              </div>
            </div>

            <div className="bg-lumen-lime border-4 border-lumen-black p-6 mb-8">
              <h2 className="font-press-start text-xl text-black mb-4">
                STRENGTHS
              </h2>
              <div className="space-y-3">
                {score >= questions.length * 0.7 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Strong understanding of {topic}</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">You've demonstrated solid knowledge in this area</p>
                  </div>
                )}
                {score >= questions.length * 0.5 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Good conceptual grasp</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">Continue practicing to reinforce understanding</p>
                  </div>
                )}
                {score >= questions.length * 0.3 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Basic familiarity</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">You have foundational knowledge to build upon</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-lumen-orange border-4 border-lumen-black p-6 mb-8">
              <h2 className="font-press-start text-xl text-black mb-4">
                AREAS TO IMPROVE
              </h2>
              <div className="space-y-3">
                {score < questions.length * 0.7 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Needs more practice on {topic}</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">Review the material and try again</p>
                  </div>
                )}
                {score < questions.length * 0.5 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Focus on fundamentals</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">Spend more time studying core concepts</p>
                  </div>
                )}
                {score < questions.length * 0.3 && (
                  <div className="bg-white border-2 border-lumen-black p-3">
                    <p className="font-mono text-sm text-black font-semibold">Significant knowledge gaps</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">Start with basic concepts and build up gradually</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-lumen-yellow border-4 border-lumen-black p-6 mb-8">
              <h2 className="font-press-start text-xl text-black mb-4">
                THINGS TO WORK ON
              </h2>
              <div className="space-y-3">
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">Practice {topic} regularly</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Consistent practice is key to mastery</p>
                </div>
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">Use multiple learning methods</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Combine reading, practice, and teaching</p>
                </div>
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">Test yourself frequently</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Regular testing reinforces memory</p>
                </div>
              </div>
            </div>

            <div className="bg-lumen-magenta border-4 border-lumen-black p-6 mb-8">
              <h2 className="font-press-start text-xl text-white mb-4">
                ACTION PLAN
              </h2>
              <div className="space-y-3">
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">1. Review incorrect answers</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Understand why you got them wrong</p>
                </div>
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">2. Practice with flashcards</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Use spaced repetition to reinforce learning</p>
                </div>
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">3. Create a mind map</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Visualize connections between concepts</p>
                </div>
                <div className="bg-white border-2 border-lumen-black p-3">
                  <p className="font-mono text-sm text-black font-semibold">4. Use Memory Palace</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">Gamify your learning with the Memory Palace</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRestart}
                className="flex-1 bg-lumen-orange border-4 border-lumen-black p-4 font-press-start text-lg text-white hover:bg-lumen-yellow hover:text-black transition-all shadow-brutalist-lg"
              >
                NEW QUIZ
              </button>
              <button
                onClick={() => window.location.href = "/dashboard/memory-palace"}
                className="flex-1 bg-white border-4 border-lumen-black p-4 font-press-start text-lg text-black hover:bg-lumen-cyan transition-all shadow-brutalist-lg"
              >
                MEMORY PALACE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}