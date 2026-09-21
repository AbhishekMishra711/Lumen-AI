"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { BACKEND_URL } from "@/utils/api";

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string) => {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
    // Code: `text`
    .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded border border-black text-xs">$1</code>')
    // Code blocks: ```text```
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded border-2 border-black my-3 overflow-x-auto font-mono text-xs"><code>$1</code></pre>')
    // Headers: # Text
    .replace(/^### (.*$)/gm, '<h3 class="font-bold text-lg mt-4 mb-2 text-black">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="font-bold text-xl mt-4 mb-2 text-black">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="font-bold text-2xl mt-4 mb-2 text-black">$1</h1>')
    // Horizontal rules: ---
    .replace(/^---$/gm, '<hr class="my-4 border-2 border-black">')
    // Lists: - item
    .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
    // Numbered lists: 1. item
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  return html;
};

export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streakData, setStreakData] = useState({ currentStreak: 0, totalHours: 0, weeklyHours: 0 });
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [workOnItems, setWorkOnItems] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Load user data on mount - using mock data for now
  useEffect(() => {
    setStreakData({
      currentStreak: 5,
      totalHours: 48,
      weeklyHours: 12,
    });
    setStrengths([
      'Problem Solving',
      'Algorithm Design',
      'Data Structures'
    ]);
    setWeaknesses([
      'Time Management',
      'Advanced Mathematics',
      'System Design'
    ]);
    setWorkOnItems([
      'Practice LeetCode daily',
      'Review System Design patterns',
      'Work on time management'
    ]);
  }, []);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that question. Please try again." }]);
      }
    } catch (error) {
      // Fallback to demo response
      setChatMessages(prev => [...prev, { role: "assistant", content: `I understand you're asking about: "${userMessage}"\n\nThis is a demo response. To get AI-powered responses, please configure your Sarvam AI API key in the backend environment variables.\n\nIn a fully configured setup, I would provide detailed explanations, examples, and study guidance based on your question.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate GitHub-like contribution grid (client-side only to avoid hydration issues)
  const [contributionGrid, setContributionGrid] = useState<number[][]>([]);

  useEffect(() => {
    const generateContributionGrid = () => {
      const weeks = 16;
      const days = 7;
      const grid = [];
      
      for (let week = 0; week < weeks; week++) {
        const weekData = [];
        for (let day = 0; day < days; day++) {
          // More realistic distribution: some days active, some not
          const rand = Math.random();
          let hours = 0;
          
          if (rand > 0.65) {
            // Active day - varied intensity
            hours = Math.floor(Math.random() * 8) + 1;
          } else if (rand > 0.45) {
            // Light activity
            hours = Math.floor(Math.random() * 3) + 1;
          }
          
          weekData.push(hours);
        }
        grid.push(weekData);
      }
      return grid;
    };

    setContributionGrid(generateContributionGrid());
  }, []);
  const getIntensityColor = (hours: number) => {
    if (hours === 0) return "bg-gray-100";
    if (hours <= 2) return "bg-lumen-lime";
    if (hours <= 4) return "bg-green-400";
    if (hours <= 6) return "bg-green-600";
    return "bg-green-800";
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Top Navigation Bar */}
      <nav className="w-full border-b-4 border-lumen-black bg-white sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/dashboard" className="group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-lumen-yellow to-lumen-orange border-4 border-lumen-black transform group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center shadow-brutalist">
                  <span className="font-press-start text-xl text-black font-black">L</span>
                </div>
                <div className="absolute inset-0 bg-lumen-cyan border-4 border-lumen-black opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center shadow-brutalist">
                  <span className="font-press-start text-xl text-black font-black">L</span>
                </div>
              </div>
              <span className="font-press-start text-2xl text-black font-black group-hover:scale-110 transition-transform">
                LUMEN
              </span>
            </div>
          </Link>

          {/* Right: User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              className="p-2 hover:bg-lumen-yellow transition-all"
            >
              {/* 3D Avatar */}
              <div className="w-10 h-10 bg-black border-4 border-lumen-black relative shadow-brutalist transform hover:rotate-6 transition-transform">
                <div className="absolute inset-1 bg-gradient-to-br from-lumen-yellow to-lumen-orange"></div>
                <div className="absolute inset-2 bg-black"></div>
                <div className="absolute inset-3 bg-gradient-to-br from-lumen-cyan to-lumen-lime"></div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-12 right-0 bg-white border-4 border-lumen-black shadow-brutalist-lg min-w-[180px]">
                <a
                  href="#"
                  className="block px-4 py-3 font-mono text-sm border-b-2 border-lumen-black hover:bg-lumen-black hover:text-white transition-all"
                >
                  &gt; SETTINGS
                </a>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full text-left block px-4 py-3 font-mono text-sm hover:bg-lumen-black hover:text-white transition-all cursor-pointer"
                >
                  &gt; LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Hero Section with Chat Interface */}
        <div className="mb-8">
          <div className="bg-white border-4 border-lumen-black shadow-brutalist-lg overflow-hidden transform hover:scale-[1.01] transition-transform">
            <div className="bg-gradient-to-r from-lumen-magenta to-lumen-cyan border-b-4 border-lumen-black px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
              </div>
              <h1 className="font-press-start text-xl text-white relative z-10">
                LumenAI
              </h1>
              <p className="text-white/80 text-sm mt-1 font-mono relative z-10">Ask me anything about your studies</p>
            </div>
            
            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-6 space-y-4 bg-[#F4F4F0]" style={{ scrollbarWidth: "thin", scrollbarColor: "#000000 #F4F4F0" }}>
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-600 py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lumen-yellow to-lumen-orange border-4 border-lumen-black shadow-brutalist transform rotate-12"></div>
                  <p className="font-press-start text-lg">START A CONVERSATION</p>
                  <p className="font-mono text-sm mt-2">Ask questions about any topic, get explanations, or clarify doubts</p>
                </div>
              )}
              
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] border-4 border-lumen-black px-4 py-3 shadow-brutalist transform hover:scale-105 transition-all ${
                    msg.role === "user" 
                      ? "bg-lumen-yellow text-black" 
                      : "bg-white text-black"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div 
                        className="font-mono text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                      />
                    ) : (
                      <p className="font-mono text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-4 border-lumen-black shadow-brutalist px-4 py-3">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-lumen-magenta border-2 border-lumen-black animate-bounce"></div>
                      <div className="w-3 h-3 bg-lumen-cyan border-2 border-lumen-black animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-3 h-3 bg-lumen-lime border-2 border-lumen-black animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t-4 border-lumen-black bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about your studies..."
                  className="flex-1 bg-[#F4F4F0] border-4 border-lumen-black px-4 py-3 font-mono text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-lumen-yellow transition-all transform focus:scale-[1.02]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-lumen-yellow text-black border-4 border-lumen-black px-6 py-3 font-press-start text-sm hover:bg-lumen-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transform hover:scale-105"
                >
                  {isLoading ? "..." : "SEND"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-lumen-yellow border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold">CURRENT STREAK</p>
                <p className="font-press-start text-3xl text-black mt-1">{streakData.currentStreak} DAYS</p>
              </div>
              <div className="w-12 h-12 bg-black border-4 border-lumen-black relative transform rotate-12">
                <div className="absolute inset-1 bg-gradient-to-br from-lumen-yellow to-lumen-orange"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-lumen-cyan border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold">TOTAL STUDY HOURS</p>
                <p className="font-press-start text-3xl text-black mt-1">{streakData.totalHours}H</p>
              </div>
              <div className="w-12 h-12 bg-black border-4 border-lumen-black relative transform -rotate-6">
                <div className="absolute inset-1 bg-gradient-to-br from-lumen-cyan to-lumen-lime"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-lumen-lime border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold">THIS WEEK</p>
                <p className="font-press-start text-3xl text-black mt-1">{streakData.weeklyHours}H</p>
              </div>
              <div className="w-12 h-12 bg-black border-4 border-lumen-black relative transform rotate-6">
                <div className="absolute inset-1 bg-gradient-to-br from-lumen-lime to-green-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Activity Heatmap - ELABORATE SECTION */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 border-4 border-lumen-black shadow-brutalist-xl p-8 mb-12 transform hover:scale-[1.01] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-lumen-lime opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-lumen-cyan opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-lumen-magenta opacity-5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-lumen-lime to-green-400 border-4 border-lumen-black transform rotate-12 animate-pulse shadow-brutalist"></div>
              <div>
                <h2 className="font-press-start text-3xl text-black">LEARNING JOURNEY</h2>
                <p className="font-mono text-sm text-gray-600 mt-1">Your study patterns over the last 16 weeks</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-press-start text-2xl text-black">{contributionGrid.flat().filter(h => h > 0).length}</div>
                <div className="font-mono text-xs text-gray-600">ACTIVE DAYS</div>
              </div>
              <div className="text-right">
                <div className="font-press-start text-2xl text-black">{contributionGrid.flat().reduce((sum, h) => sum + h, 0)}H</div>
                <div className="font-mono text-xs text-gray-600">TOTAL HOURS</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-6 relative z-10">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
              <div key={idx} className="text-center font-mono text-xs text-gray-600 font-bold">
                {day}
              </div>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto pb-6 relative z-10">
            {contributionGrid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1 min-w-[50px]">
                {week.map((hours, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-12 h-12 border-2 border-lumen-black hover:scale-125 hover:rotate-45 transition-all duration-300 cursor-pointer transform hover:translate-z-4 relative group ${getIntensityColor(hours)} ${hours > 0 ? 'animate-pulse' : ''}`}
                    title={`${hours} hours`}
                  >
                    {hours > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="font-mono text-xs font-bold text-black">{hours}h</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t-4 border-lumen-black relative z-10">
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="text-gray-600 font-bold">INTENSITY</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 border-2 border-lumen-black hover:scale-125 transition-transform"></div>
                <div className="w-8 h-8 bg-lumen-lime border-2 border-lumen-black hover:scale-125 transition-transform"></div>
                <div className="w-8 h-8 bg-green-400 border-2 border-lumen-black hover:scale-125 transition-transform"></div>
                <div className="w-8 h-8 bg-green-600 border-2 border-lumen-black hover:scale-125 transition-transform"></div>
                <div className="w-8 h-8 bg-green-800 border-2 border-lumen-black hover:scale-125 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-lumen-lime border-2 border-lumen-black"></div>
                <span className="text-gray-600">Light (1-2h)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 border-2 border-lumen-black"></div>
                <span className="text-gray-600">Heavy (5-8h)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths, Weaknesses, Work On - EXPANDED SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-lumen-magenta to-lumen-cyan border-4 border-lumen-black transform rotate-12 animate-pulse"></div>
            <div>
              <h2 className="font-press-start text-3xl text-black">LEARNING INSIGHTS</h2>
              <p className="font-mono text-sm text-gray-600 mt-1">Your personalized learning profile and recommendations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* STRENGTHS */}
            <div className="bg-gradient-to-br from-lumen-lime to-green-400 border-4 border-lumen-black shadow-brutalist-xl p-8 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }}></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="font-press-start text-2xl text-black">STRENGTHS</h3>
                  <p className="font-mono text-sm text-black/70 mt-1">What you excel at</p>
                </div>
                <div className="w-16 h-16 bg-black border-4 border-lumen-black flex items-center justify-center transform rotate-45 shadow-brutalist animate-spin" style={{ animationDuration: "8s" }}>
                  <div className="w-6 h-6 bg-white"></div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {strengths.length > 0 ? strengths.map((strength, idx) => (
                  <div key={idx} className="bg-white border-4 border-lumen-black p-5 hover:translate-x-2 hover:scale-105 transition-all shadow-lg hover:shadow-brutalist relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lumen-lime to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-8 h-8 bg-lumen-lime border-2 border-lumen-black flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-4 h-4 bg-black"></div>
                      </div>
                      <div>
                        <p className="font-mono text-base text-black font-semibold">{strength}</p>
                        <p className="font-mono text-xs text-gray-600 mt-1">Keep building on this foundation</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white border-4 border-lumen-black p-6 text-center">
                    <p className="font-mono text-sm italic text-gray-700">Complete more activities to see your strengths</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t-4 border-lumen-black relative z-10">
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-black">Total Strengths</span>
                  <span className="font-bold text-black bg-white px-3 py-1 border-2 border-lumen-black">{strengths.length}</span>
                </div>
              </div>
            </div>

            {/* AREAS TO IMPROVE */}
            <div className="bg-gradient-to-br from-lumen-orange to-red-500 border-4 border-lumen-black shadow-brutalist-xl p-8 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.3s" }}></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.8s" }}></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="font-press-start text-2xl text-black">AREAS TO IMPROVE</h3>
                  <p className="font-mono text-sm text-black/70 mt-1">Focus points for growth</p>
                </div>
                <div className="w-16 h-16 bg-black border-4 border-lumen-black flex items-center justify-center transform -rotate-45 shadow-brutalist animate-spin" style={{ animationDuration: "8s" }}>
                  <div className="w-6 h-6 bg-white"></div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {weaknesses.length > 0 ? weaknesses.map((weakness, idx) => (
                  <div key={idx} className="bg-white border-4 border-lumen-black p-5 hover:translate-x-2 hover:scale-105 transition-all shadow-lg hover:shadow-brutalist relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lumen-orange to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="w-8 h-8 bg-lumen-orange border-2 border-lumen-black flex items-center justify-center flex-shrink-0 mt-1">
                        <div className="w-1 h-4 bg-black"></div>
                      </div>
                      <div>
                        <p className="font-mono text-base text-black font-semibold">{weakness}</p>
                        <p className="font-mono text-xs text-gray-600 mt-1">Target for improvement</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white border-4 border-lumen-black p-6 text-center">
                    <p className="font-mono text-sm italic text-gray-700">Complete more activities to see areas for improvement</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t-4 border-lumen-black relative z-10">
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-black">Focus Areas</span>
                  <span className="font-bold text-black bg-white px-3 py-1 border-2 border-lumen-black">{weaknesses.length}</span>
                </div>
              </div>
            </div>

            {/* WORK ON */}
            <div className="bg-gradient-to-br from-lumen-yellow to-lumen-orange border-4 border-lumen-black shadow-brutalist-xl p-8 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.6s" }}></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.1s" }}></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h3 className="font-press-start text-2xl text-black">WORK ON</h3>
                  <p className="font-mono text-sm text-black/70 mt-1">Actionable next steps</p>
                </div>
                <div className="w-16 h-16 bg-black border-4 border-lumen-black flex items-center justify-center transform rotate-90 shadow-brutalist animate-spin" style={{ animationDuration: "8s" }}>
                  <div className="w-2 h-6 bg-white mx-auto"></div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {workOnItems.length > 0 ? workOnItems.map((item, idx) => {
                  // Determine link based on item content
                  let linkUrl = '/dashboard/quiz';
                  let moduleType = 'QUIZ';
                  if (item.toLowerCase().includes('leetcode') || item.toLowerCase().includes('practice')) {
                    linkUrl = '/dashboard/quiz';
                    moduleType = 'QUIZ';
                  } else if (item.toLowerCase().includes('flashcard') || item.toLowerCase().includes('review')) {
                    linkUrl = '/dashboard/flashcards';
                    moduleType = 'FLASHCARDS';
                  } else if (item.toLowerCase().includes('system') || item.toLowerCase().includes('design')) {
                    linkUrl = '/dashboard/mindmap';
                    moduleType = 'MIND MAP';
                  } else if (item.toLowerCase().includes('memory') || item.toLowerCase().includes('palace')) {
                    linkUrl = '/dashboard/memory-palace';
                    moduleType = 'MEMORY PALACE';
                  }
                  
                  return (
                    <Link key={idx} href={linkUrl} className="block">
                      <div className="bg-white border-4 border-lumen-black p-5 hover:bg-lumen-cyan hover:translate-x-2 hover:scale-105 transition-all group shadow-lg hover:shadow-brutalist relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lumen-cyan to-transparent opacity-0 group-hover:opacity-30 transition-opacity"></div>
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-8 h-8 bg-lumen-yellow border-2 border-lumen-black flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-lumen-cyan transition-colors">
                            <div className="w-1 h-4 bg-black group-hover:bg-white transition-colors"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-mono text-base text-black font-semibold">{item}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-mono text-xs text-gray-600">Practice in:</span>
                              <span className="font-press-start text-xs bg-black text-lumen-yellow px-2 py-1 border-2 border-lumen-black">{moduleType}</span>
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-black border-3 border-lumen-black flex items-center justify-center transform group-hover:rotate-90 transition-transform flex-shrink-0">
                            <div className="w-2 h-5 bg-lumen-cyan mx-auto"></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="bg-white border-4 border-lumen-black p-6 text-center">
                    <p className="font-mono text-sm italic text-gray-700">Start learning to get personalized recommendations</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t-4 border-lumen-black relative z-10">
                <div className="flex items-center justify-between font-mono text-sm">
                  <span className="text-black">Action Items</span>
                  <span className="font-bold text-black bg-white px-3 py-1 border-2 border-lumen-black">{workOnItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: MIND MAP */}
          <Link
            href="/dashboard/mindmap"
            className="group bg-lumen-cyan border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 hover:rotate-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white border-4 border-lumen-black flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform shadow-brutalist relative">
                <div className="absolute inset-2 bg-gradient-to-br from-lumen-cyan to-lumen-lime opacity-50"></div>
                <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10">
                  {/* Central node */}
                  <rect x="20" y="20" width="8" height="8" fill="black" />
                  {/* Outer nodes */}
                  <rect x="8" y="8" width="6" height="6" fill="black" />
                  <rect x="34" y="8" width="6" height="6" fill="black" />
                  <rect x="8" y="34" width="6" height="6" fill="black" />
                  <rect x="34" y="34" width="6" height="6" fill="black" />
                  {/* Connections */}
                  <line x1="14" y1="11" x2="20" y2="20" stroke="black" strokeWidth="2" />
                  <line x1="34" y1="11" x2="24" y2="20" stroke="black" strokeWidth="2" />
                  <line x1="11" y1="34" x2="20" y2="24" stroke="black" strokeWidth="2" />
                  <line x1="34" y1="34" x2="24" y2="24" stroke="black" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="font-press-start text-black text-lg">MIND MAP</h3>
              <p className="font-mono text-black text-sm mt-2">Visual learning</p>
            </div>
          </Link>

          {/* Module 2: FLASHCARDS */}
          <Link
            href="/dashboard/flashcards"
            className="group bg-lumen-magenta border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 hover:-rotate-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white border-4 border-lumen-black flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform shadow-brutalist relative">
                <div className="absolute inset-2 bg-gradient-to-br from-lumen-magenta to-lumen-orange opacity-50"></div>
                <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10">
                  {/* Card back */}
                  <rect x="8" y="8" width="32" height="32" fill="none" stroke="black" strokeWidth="3" />
                  {/* Card lines */}
                  <line x1="8" y1="16" x2="40" y2="16" stroke="black" strokeWidth="2" />
                  <line x1="8" y1="24" x2="40" y2="24" stroke="black" strokeWidth="2" />
                  <line x1="8" y1="32" x2="40" y2="32" stroke="black" strokeWidth="2" />
                  {/* Arrow icon */}
                  <polygon points="32,36 38,36 35,30" fill="black" />
                </svg>
              </div>
              <h3 className="font-press-start text-white text-lg">FLASHCARDS</h3>
              <p className="font-mono text-white text-sm mt-2">Spaced repetition</p>
            </div>
          </Link>

          {/* Module 3: QUIZ */}
          <Link
            href="/dashboard/quiz"
            className="group bg-lumen-lime border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 hover:-rotate-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white border-4 border-lumen-black flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform shadow-brutalist relative">
                <div className="absolute inset-2 bg-gradient-to-br from-lumen-lime to-green-400 opacity-50"></div>
                <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10">
                  {/* Question mark box */}
                  <rect x="8" y="8" width="32" height="32" fill="none" stroke="black" strokeWidth="3" />
                  {/* Question mark */}
                  <rect x="20" y="12" width="8" height="4" fill="black" />
                  <rect x="16" y="18" width="16" height="4" fill="black" />
                  <rect x="12" y="24" width="24" height="4" fill="black" />
                  <rect x="16" y="30" width="16" height="4" fill="black" />
                  <rect x="20" y="36" width="8" height="4" fill="black" />
                </svg>
              </div>
              <h3 className="font-press-start text-black text-lg">QUIZ</h3>
              <p className="font-mono text-black text-sm mt-2">Test knowledge</p>
            </div>
          </Link>

          {/* Module 4: MEMORY PALACE */}
          <Link
            href="/dashboard/memory-palace"
            className="group bg-lumen-orange border-4 border-lumen-black shadow-brutalist-lg p-6 hover:-translate-x-2 hover:-translate-y-2 hover:shadow-2xl transition-all transform hover:scale-105 hover:-rotate-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white border-4 border-lumen-black flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform shadow-brutalist relative">
                <div className="absolute inset-2 bg-gradient-to-br from-lumen-orange to-red-500 opacity-50"></div>
                <svg width="48" height="48" viewBox="0 0 48 48" className="relative z-10">
                  {/* Building structure */}
                  <rect x="8" y="20" width="32" height="20" fill="none" stroke="black" strokeWidth="3" />
                  {/* Roof */}
                  <polygon points="8,20 24,8 40,20" fill="none" stroke="black" strokeWidth="3" />
                  {/* Door */}
                  <rect x="20" y="28" width="8" height="12" fill="black" />
                  {/* Windows */}
                  <rect x="12" y="24" width="6" height="6" fill="black" />
                  <rect x="30" y="24" width="6" height="6" fill="black" />
                </svg>
              </div>
              <h3 className="font-press-start text-black text-lg">MEMORY PALACE</h3>
              <p className="font-mono text-black text-sm mt-2">Gamified learning</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
