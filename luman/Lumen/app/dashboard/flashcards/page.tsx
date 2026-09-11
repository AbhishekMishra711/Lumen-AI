"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  generateFlashcardsAPI,
  saveFlashcardDeckAPI,
  getSavedDecksAPI,
  deleteDeckAPI,
  getClientUserId,
  type Flashcard,
  type FlashcardDeck,
} from "@/utils/api";

type InputTab = "file" | "youtube" | "text";
type ViewMode = "single" | "grid" | "study";

export default function FlashcardsPage() {
  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState<InputTab>("file");
  const [viewMode, setViewMode] = useState<ViewMode>("single");

  // Inputs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textPrompt, setTextPrompt] = useState("");
  const [cardCount, setCardCount] = useState<number>(10);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Deck state
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Study Mode state
  const [studyScores, setStudyScores] = useState<{ [cardId: number]: "mastered" | "practice" }>({});
  const [studyFinished, setStudyFinished] = useState(false);

  // Saved Decks Drawer (MongoDB)
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);

  // Toast auto-clear
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  }, []);

  // Keyboard navigation for card flip and next/prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsCardFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (currentDeck && currentCardIndex < currentDeck.flashcards.length - 1) {
          setCurrentCardIndex((prev) => prev + 1);
          setIsCardFlipped(false);
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (currentDeck && currentCardIndex > 0) {
          setCurrentCardIndex((prev) => prev - 1);
          setIsCardFlipped(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDeck, currentCardIndex]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Generate Flashcards
  const handleGenerate = async () => {
    setErrorMsg(null);
    setGenerating(true);

    try {
      const formData = new FormData();
      formData.append("cardCount", cardCount.toString());

      if (activeTab === "file") {
        if (selectedFiles.length === 0) {
          throw new Error("Please select one or more documents (PDF, DOCX, PPTX, TXT)");
        }
        selectedFiles.forEach((file) => formData.append("files", file));
        formData.append("sourceType", "Files");
      } else if (activeTab === "youtube") {
        if (!youtubeUrl.trim()) {
          throw new Error("Please enter a valid YouTube video URL");
        }
        formData.append("url", youtubeUrl.trim());
        formData.append("sourceType", "YouTube Video");
      } else {
        if (!textPrompt.trim()) {
          throw new Error("Please paste your study notes or concept prompt");
        }
        formData.append("text", textPrompt.trim());
        formData.append("sourceType", "Text Notes");
      }

      const result = await generateFlashcardsAPI(formData);

      const deck: FlashcardDeck = {
        title: result.title || "Generated Flashcard Deck",
        summary: result.summary || "High-yield active recall flashcards.",
        sourceType: result.sourceType || "Study Material",
        totalCards: result.flashcards ? result.flashcards.length : 0,
        flashcards: result.flashcards || [],
        isFallback: result.isFallback || false,
      };

      setCurrentDeck(deck);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
      setSavedSuccess(false);
      setStudyScores({});
      setStudyFinished(false);
      showToast(`⚡ Successfully generated ${deck.flashcards.length} flashcards!`);

      // Scroll to results
      setTimeout(() => {
        const el = document.getElementById("flashcard-stage");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate flashcards";
      setErrorMsg(msg);
      showToast(`❌ ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  // Save Deck to MongoDB
  const handleSaveDeck = async () => {
    if (!currentDeck) return;
    try {
      const userId = getClientUserId();
      const saved = await saveFlashcardDeckAPI({
        title: currentDeck.title,
        summary: currentDeck.summary,
        sourceType: currentDeck.sourceType,
        flashcards: currentDeck.flashcards,
        userId,
      });
      setCurrentDeck((prev) => (prev ? { ...prev, _id: saved._id } : null));
      setSavedSuccess(true);
      showToast("💾 Flashcard deck saved to MongoDB Atlas!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save deck";
      showToast(`❌ ${msg}`);
    }
  };

  // Open Saved Decks Drawer
  const openSavedDecks = async () => {
    setShowSavedDrawer(true);
    setLoadingDecks(true);
    try {
      const decks = await getSavedDecksAPI();
      setSavedDecks(decks);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load saved decks";
      showToast(`❌ ${msg}`);
    } finally {
      setLoadingDecks(false);
    }
  };

  // Load a Saved Deck from MongoDB into Studio
  const handleLoadDeck = (deck: FlashcardDeck) => {
    setCurrentDeck(deck);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setSavedSuccess(true);
    setShowSavedDrawer(false);
    setStudyScores({});
    setStudyFinished(false);
    showToast(`📖 Loaded "${deck.title}" (${deck.flashcards.length} cards)`);
  };

  // Delete Deck from MongoDB
  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this deck from MongoDB?")) return;
    try {
      await deleteDeckAPI(deckId);
      setSavedDecks((prev) => prev.filter((d) => (d._id || d.id) !== deckId));
      if (currentDeck && (currentDeck._id === deckId || currentDeck.id === deckId)) {
        setSavedSuccess(false);
      }
      showToast("🗑️ Deck deleted from MongoDB");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete deck";
      showToast(`❌ ${msg}`);
    }
  };

  // Export Deck
  const handleExportJSON = () => {
    if (!currentDeck) return;
    const blob = new Blob([JSON.stringify(currentDeck, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDeck.title.toLowerCase().replace(/\s+/g, "_")}_flashcards.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Exported deck as JSON file");
  };

  // Study Mode Scoring
  const handleStudyScore = (score: "mastered" | "practice") => {
    if (!currentDeck) return;
    const card = currentDeck.flashcards[currentCardIndex];
    setStudyScores((prev) => ({ ...prev, [card.id]: score }));

    if (currentCardIndex < currentDeck.flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsCardFlipped(false);
    } else {
      setStudyFinished(true);
    }
  };

  const masteredCount = Object.values(studyScores).filter((s) => s === "mastered").length;
  const practiceCount = Object.values(studyScores).filter((s) => s === "practice").length;

  const currentCard: Flashcard | undefined =
    currentDeck ? currentDeck.flashcards[currentCardIndex] : undefined;

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-black">
      {/* Top Navigation Bar */}
      <nav className="w-full border-b-4 border-lumen-black bg-[#F4F4F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-press-start text-xs border-2 border-lumen-black px-3 py-1.5 bg-white hover:bg-lumen-yellow transition-all shadow-brutalist"
            >
              &lt; DASHBOARD
            </Link>
            <span className="font-press-start text-lg tracking-wider text-lumen-black">
              LUMEN // FLASHCARDS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openSavedDecks}
              className="px-4 py-2 border-3 border-lumen-black bg-[#FFCC00] font-press-start text-xs shadow-brutalist hover:bg-lumen-black hover:text-[#FFCC00] hover:translate-y-0.5 transition-all"
            >
              📂 SAVED DECKS (MONGODB)
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Banner Section */}
        <div className="border-4 border-lumen-black bg-[#FF00FF] p-6 mb-8 shadow-brutalist text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-2 py-1 bg-black text-[#FFCC00] font-press-start text-[10px] mb-2">
              ACTIVE RECALL // SARVAM AI + MONGODB
            </div>
            <h1 className="font-press-start text-2xl md:text-3xl text-white drop-shadow-[2px_2px_0px_#000000]">
              FLASHCARD STUDIO
            </h1>
            <p className="font-mono text-sm mt-1 text-white/90">
              Transform PDFs, Word docs, PowerPoint decks, YouTube lectures, or notes into active recall flashcards.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-black border-2 border-white text-white font-mono text-xs flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#39FF14] animate-pulse"></span>
              MongoDB Online
            </span>
          </div>
        </div>

        {/* Input Generation Workspace Card */}
        <div className="border-4 border-lumen-black bg-white p-6 md:p-8 mb-10 shadow-brutalist">
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-2 border-b-4 border-lumen-black pb-4 mb-6">
            <button
              onClick={() => setActiveTab("file")}
              className={`py-3 px-4 font-press-start text-xs md:text-sm border-3 border-lumen-black transition-all ${
                activeTab === "file"
                  ? "bg-[#00FFFF] text-black shadow-brutalist translate-y-[-2px]"
                  : "bg-[#F4F4F0] text-black/70 hover:bg-[#E5E5E0]"
              }`}
            >
              📁 UPLOAD DOCS
            </button>
            <button
              onClick={() => setActiveTab("youtube")}
              className={`py-3 px-4 font-press-start text-xs md:text-sm border-3 border-lumen-black transition-all ${
                activeTab === "youtube"
                  ? "bg-[#FFCC00] text-black shadow-brutalist translate-y-[-2px]"
                  : "bg-[#F4F4F0] text-black/70 hover:bg-[#E5E5E0]"
              }`}
            >
              🎬 YOUTUBE URL
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`py-3 px-4 font-press-start text-xs md:text-sm border-3 border-lumen-black transition-all ${
                activeTab === "text"
                  ? "bg-[#39FF14] text-black shadow-brutalist translate-y-[-2px]"
                  : "bg-[#F4F4F0] text-black/70 hover:bg-[#E5E5E0]"
              }`}
            >
              📝 TEXT / NOTES
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === "file" && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-4 border-dashed border-lumen-black p-10 text-center cursor-pointer transition-all ${
                  isDragOver ? "bg-[#00FFFF]/20 scale-[0.99]" : "bg-[#F9F9F6] hover:bg-[#F0F0EA]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="font-press-start text-3xl mb-3">📄 ⬆️</div>
                <h3 className="font-press-start text-sm md:text-base text-lumen-black mb-2">
                  DRAG & DROP STUDY DOCUMENTS HERE
                </h3>
                <p className="font-mono text-xs text-gray-600 max-w-md mx-auto">
                  Supports multiple files: PDF (Text layer + OCR for scanned pages), Word (.docx), PowerPoint (.pptx), and TXT. Max 25MB.
                </p>
                {selectedFiles.length > 0 && (
                  <div className="mt-4 p-3 bg-[#00FFFF] border-2 border-lumen-black inline-block text-left font-mono text-xs">
                    <strong>Selected ({selectedFiles.length}):</strong>{" "}
                    {selectedFiles.map((f) => f.name).join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: YouTube URL */}
          {activeTab === "youtube" && (
            <div className="space-y-3">
              <label className="font-press-start text-xs block text-lumen-black">
                YOUTUBE VIDEO OR SHORTS URL:
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full p-4 border-4 border-lumen-black font-mono text-sm bg-[#F9F9F6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FFCC00]"
              />
              <p className="font-mono text-xs text-gray-500">
                Transcripts and captions will be automatically extracted and turned into active-recall flashcards.
              </p>
            </div>
          )}

          {/* Tab 3: Text Input */}
          {activeTab === "text" && (
            <div className="space-y-3">
              <label className="font-press-start text-xs block text-lumen-black">
                PASTE LECTURE NOTES, CONCEPTS, OR TOPIC PROMPT:
              </label>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={6}
                placeholder="e.g. Paste lecture notes, textbook excerpts, or write 'Explain Machine Learning and Neural Networks'..."
                className="w-full p-4 border-4 border-lumen-black font-mono text-sm bg-[#F9F9F6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#39FF14]"
              />
            </div>
          )}

          {/* Generation Controls Row */}
          <div className="mt-6 pt-6 border-t-4 border-lumen-black flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="font-press-start text-xs text-lumen-black whitespace-nowrap">
                CARDS:
              </label>
              <select
                value={cardCount}
                onChange={(e) => setCardCount(parseInt(e.target.value, 10))}
                className="p-3 border-3 border-lumen-black bg-[#F4F4F0] font-press-start text-xs focus:outline-none"
              >
                <option value={5}>5 CARDS</option>
                <option value={10}>10 CARDS</option>
                <option value={15}>15 CARDS</option>
                <option value={20}>20 CARDS</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full sm:w-auto px-8 py-4 border-4 border-lumen-black font-press-start text-xs md:text-sm shadow-brutalist transition-all flex items-center justify-center gap-3 ${
                generating
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#FFCC00] text-black hover:bg-black hover:text-[#FFCC00] hover:translate-y-1"
              }`}
            >
              {generating ? (
                <>
                  <span className="animate-spin text-lg">⚙️</span>
                  <span>ANALYZING & GENERATING...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>GENERATE ACTIVE RECALL CARDS</span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="mt-4 p-4 border-3 border-lumen-black bg-[#FF4F00] text-white font-mono text-xs">
              <strong>ERROR:</strong> {errorMsg}
            </div>
          )}
        </div>

        {/* Flashcard Studio Display Section */}
        {currentDeck && (
          <div id="flashcard-stage" className="space-y-6">
            {/* Deck Header & Mode Switcher */}
            <div className="border-4 border-lumen-black bg-white p-6 shadow-brutalist flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-press-start text-[10px] px-2 py-1 bg-black text-white">
                    {currentDeck.sourceType.toUpperCase()}
                  </span>
                  <span className="font-press-start text-[10px] px-2 py-1 bg-[#00FFFF] text-black border border-black">
                    {currentDeck.flashcards.length} CARDS
                  </span>
                  {savedSuccess && (
                    <span className="font-press-start text-[10px] px-2 py-1 bg-[#39FF14] text-black border border-black">
                      ✓ SAVED IN MONGODB
                    </span>
                  )}
                </div>
                <h2 className="font-press-start text-lg md:text-xl text-black">
                  {currentDeck.title}
                </h2>
                <p className="font-mono text-xs text-gray-600 mt-1 max-w-2xl">
                  {currentDeck.summary}
                </p>
              </div>

              {/* View Mode & Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setViewMode("single")}
                  className={`px-3 py-2 border-2 border-lumen-black font-press-start text-[11px] transition-all ${
                    viewMode === "single"
                      ? "bg-black text-[#FFCC00]"
                      : "bg-[#F4F4F0] hover:bg-gray-200"
                  }`}
                >
                  🎴 CARD
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 border-2 border-lumen-black font-press-start text-[11px] transition-all ${
                    viewMode === "grid"
                      ? "bg-black text-[#FFCC00]"
                      : "bg-[#F4F4F0] hover:bg-gray-200"
                  }`}
                >
                  ▦ GRID
                </button>
                <button
                  onClick={() => {
                    setViewMode("study");
                    setCurrentCardIndex(0);
                    setIsCardFlipped(false);
                    setStudyFinished(false);
                  }}
                  className={`px-3 py-2 border-2 border-lumen-black font-press-start text-[11px] transition-all ${
                    viewMode === "study"
                      ? "bg-[#39FF14] text-black shadow-brutalist"
                      : "bg-[#F4F4F0] hover:bg-gray-200"
                  }`}
                >
                  🎯 STUDY MODE
                </button>
                <button
                  onClick={handleSaveDeck}
                  disabled={savedSuccess}
                  className="px-3 py-2 border-2 border-lumen-black bg-[#FFCC00] font-press-start text-[11px] hover:bg-black hover:text-[#FFCC00] transition-all"
                >
                  {savedSuccess ? "✓ SAVED" : "💾 SAVE"}
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-2 border-2 border-lumen-black bg-[#F4F4F0] font-press-start text-[11px] hover:bg-black hover:text-white transition-all"
                >
                  📥 EXPORT
                </button>
              </div>
            </div>

            {/* View 1: 3D Single Card Stage */}
            {viewMode === "single" && currentCard && (
              <div className="space-y-4">
                {/* 3D Flashcard */}
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  style={{ perspective: "1000px" }}
                  className="w-full min-h-[360px] cursor-pointer select-none"
                >
                  <div
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isCardFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="relative w-full min-h-[360px] border-4 border-lumen-black shadow-brutalist"
                  >
                    {/* Front Face (Question) */}
                    <div
                      style={{ backfaceVisibility: "hidden" }}
                      className="absolute inset-0 bg-white p-8 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-3">
                        <span className="font-press-start text-xs px-2 py-1 bg-black text-[#FFCC00]">
                          {currentCard.category || "CONCEPT"}
                        </span>
                        <span
                          className={`font-press-start text-[10px] px-2 py-1 border border-black ${
                            currentCard.difficulty === "easy"
                              ? "bg-[#39FF14]"
                              : currentCard.difficulty === "hard"
                              ? "bg-[#FF4F00] text-white"
                              : "bg-[#FFCC00]"
                          }`}
                        >
                          {currentCard.difficulty?.toUpperCase() || "MEDIUM"}
                        </span>
                      </div>

                      <div className="my-6 text-center">
                        <p className="font-press-start text-xs text-gray-400 mb-2">
                          ACTIVE RECALL QUESTION
                        </p>
                        <h3 className="font-press-start text-base md:text-xl text-black leading-relaxed">
                          {currentCard.question}
                        </h3>
                      </div>

                      <div className="text-center border-t-2 border-gray-200 pt-3 text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
                        <span>🔄</span> Click or press <strong>[SPACE]</strong> to flip to answer
                      </div>
                    </div>

                    {/* Back Face (Answer) */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                      className="absolute inset-0 bg-[#FFFDF0] p-8 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between border-b-2 border-lumen-black pb-3">
                        <span className="font-press-start text-xs px-2 py-1 bg-[#39FF14] text-black border border-black">
                          ANSWER EXPLANATION
                        </span>
                        <span className="font-mono text-xs text-gray-600">
                          Card {currentCardIndex + 1} of {currentDeck.flashcards.length}
                        </span>
                      </div>

                      <div className="my-4">
                        <p className="font-mono text-sm md:text-base text-black font-semibold mb-4 leading-relaxed">
                          {currentCard.answer}
                        </p>

                        {currentCard.keyPoints && currentCard.keyPoints.length > 0 && (
                          <div className="mt-3 p-3 bg-white border-2 border-black">
                            <span className="font-press-start text-[10px] text-gray-600 block mb-1.5">
                              KEY TAKEAWAYS:
                            </span>
                            <ul className="space-y-1">
                              {currentCard.keyPoints.map((pt, i) => (
                                <li key={i} className="font-mono text-xs text-black flex items-start gap-2">
                                  <span className="text-[#FF00FF]">▸</span> {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-center border-t-2 border-lumen-black pt-3 text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
                        <span>🔄</span> Click or press <strong>[SPACE]</strong> to flip back
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls & Navigation */}
                <div className="border-4 border-lumen-black bg-white p-4 shadow-brutalist flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentCardIndex > 0) {
                        setCurrentCardIndex(currentCardIndex - 1);
                        setIsCardFlipped(false);
                      }
                    }}
                    disabled={currentCardIndex === 0}
                    className={`px-5 py-3 border-3 border-lumen-black font-press-start text-xs transition-all ${
                      currentCardIndex === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#00FFFF] hover:bg-black hover:text-[#00FFFF]"
                    }`}
                  >
                    &lt; PREV
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="font-press-start text-sm text-black">
                      {String(currentCardIndex + 1).padStart(2, "0")} /{" "}
                      {String(currentDeck.flashcards.length).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 mt-1">
                      Use Arrow Keys ← → to navigate
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (currentCardIndex < currentDeck.flashcards.length - 1) {
                        setCurrentCardIndex(currentCardIndex + 1);
                        setIsCardFlipped(false);
                      }
                    }}
                    disabled={currentCardIndex === currentDeck.flashcards.length - 1}
                    className={`px-5 py-3 border-3 border-lumen-black font-press-start text-xs transition-all ${
                      currentCardIndex === currentDeck.flashcards.length - 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#00FFFF] hover:bg-black hover:text-[#00FFFF]"
                    }`}
                  >
                    NEXT &gt;
                  </button>
                </div>
              </div>
            )}

            {/* View 2: Grid Overview */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentDeck.flashcards.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="border-4 border-lumen-black bg-white p-5 shadow-brutalist flex flex-col justify-between hover:-translate-y-1 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2 mb-3">
                        <span className="font-press-start text-[10px] px-2 py-0.5 bg-black text-[#FFCC00]">
                          #{idx + 1} {card.category}
                        </span>
                        <span className="font-press-start text-[9px] text-gray-500">
                          {card.difficulty?.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-press-start text-xs text-black mb-3 leading-relaxed">
                        {card.question}
                      </h4>
                      <p className="font-mono text-xs text-gray-700 bg-[#F4F4F0] p-3 border-2 border-black mb-3">
                        {card.answer}
                      </p>
                    </div>

                    {card.keyPoints && card.keyPoints.length > 0 && (
                      <div className="text-[11px] font-mono text-gray-600 border-t border-gray-200 pt-2">
                        {card.keyPoints.map((kp, kIdx) => (
                          <span key={kIdx} className="inline-block bg-gray-100 px-1.5 py-0.5 mr-1 mb-1 border">
                            {kp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* View 3: Active Study Mode */}
            {viewMode === "study" && currentCard && (
              <div className="space-y-6">
                {/* Score & Progress Tracker */}
                <div className="border-4 border-lumen-black bg-white p-4 shadow-brutalist flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-press-start text-xs">
                      STUDY PROGRESS: {currentCardIndex + 1} / {currentDeck.flashcards.length}
                    </span>
                    <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
                      <span className="px-2 py-0.5 bg-[#39FF14] text-black border border-black">
                        Mastered: {masteredCount}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FF4F00] text-white border border-black">
                        Practice: {practiceCount}
                      </span>
                    </div>
                  </div>

                  <div className="font-press-start text-xs text-[#FF00FF]">
                    {Math.round(((currentCardIndex + 1) / currentDeck.flashcards.length) * 100)}%
                  </div>
                </div>

                {!studyFinished ? (
                  <div className="space-y-4">
                    {/* Active Question Card */}
                    <div className="border-4 border-lumen-black bg-white p-8 shadow-brutalist min-h-[300px] flex flex-col justify-between">
                      <div>
                        <span className="font-press-start text-[10px] px-2 py-1 bg-black text-[#FFCC00] inline-block mb-4">
                          QUESTION #{currentCardIndex + 1}
                        </span>
                        <h3 className="font-press-start text-lg md:text-xl text-black leading-relaxed">
                          {currentCard.question}
                        </h3>
                      </div>

                      {/* Reveal Answer Area */}
                      {isCardFlipped ? (
                        <div className="mt-6 p-5 border-3 border-lumen-black bg-[#FFFDF0]">
                          <span className="font-press-start text-xs text-[#39FF14] bg-black px-2 py-1 inline-block mb-2">
                            ANSWER
                          </span>
                          <p className="font-mono text-sm md:text-base text-black mb-3">
                            {currentCard.answer}
                          </p>
                          {currentCard.keyPoints && currentCard.keyPoints.length > 0 && (
                            <ul className="font-mono text-xs text-gray-600 space-y-1">
                              {currentCard.keyPoints.map((kp, i) => (
                                <li key={i}>• {kp}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsCardFlipped(true)}
                          className="mt-6 w-full py-4 border-3 border-lumen-black bg-[#FFCC00] font-press-start text-xs hover:bg-black hover:text-[#FFCC00] transition-all"
                        >
                          👁️ REVEAL ANSWER
                        </button>
                      )}
                    </div>

                    {/* Self-Grading Buttons (Active when flipped) */}
                    {isCardFlipped && (
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => handleStudyScore("practice")}
                          className="py-4 border-4 border-lumen-black bg-[#FF4F00] text-white font-press-start text-xs md:text-sm shadow-brutalist hover:bg-black hover:text-[#FF4F00] transition-all"
                        >
                          ❌ NEEDS PRACTICE
                        </button>
                        <button
                          onClick={() => handleStudyScore("mastered")}
                          className="py-4 border-4 border-lumen-black bg-[#39FF14] text-black font-press-start text-xs md:text-sm shadow-brutalist hover:bg-black hover:text-[#39FF14] transition-all"
                        >
                          ✓ MASTERED IT!
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Completion Screen */
                  <div className="border-4 border-lumen-black bg-white p-10 shadow-brutalist text-center space-y-6">
                    <div className="font-press-start text-4xl">🏆</div>
                    <h3 className="font-press-start text-2xl text-black">
                      STUDY SESSION COMPLETE!
                    </h3>
                    <p className="font-mono text-sm text-gray-600 max-w-md mx-auto">
                      Great job completing active recall practice on &quot;{currentDeck.title}&quot;!
                    </p>

                    <div className="flex justify-center gap-6 max-w-sm mx-auto">
                      <div className="p-4 border-3 border-black bg-[#39FF14]/30 flex-1">
                        <span className="font-press-start text-2xl text-black block">
                          {masteredCount}
                        </span>
                        <span className="font-mono text-xs">Mastered</span>
                      </div>
                      <div className="p-4 border-3 border-black bg-[#FF4F00]/30 flex-1">
                        <span className="font-press-start text-2xl text-black block">
                          {practiceCount}
                        </span>
                        <span className="font-mono text-xs">Review Again</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                      <button
                        onClick={() => {
                          setCurrentCardIndex(0);
                          setIsCardFlipped(false);
                          setStudyScores({});
                          setStudyFinished(false);
                        }}
                        className="px-6 py-3 border-3 border-lumen-black bg-[#FFCC00] font-press-start text-xs shadow-brutalist hover:bg-black hover:text-[#FFCC00]"
                      >
                        🔄 RESTART SESSION
                      </button>
                      <button
                        onClick={() => setViewMode("single")}
                        className="px-6 py-3 border-3 border-lumen-black bg-white font-press-start text-xs shadow-brutalist hover:bg-gray-100"
                      >
                        🎴 BACK TO CARDS
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Saved Decks Drawer / Modal (MongoDB Atlas) */}
      {showSavedDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border-4 border-lumen-black shadow-brutalist max-h-[85vh] flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b-4 border-lumen-black bg-[#FFCC00] flex items-center justify-between">
              <div>
                <h3 className="font-press-start text-sm md:text-base text-black">
                  SAVED DECKS // MONGODB
                </h3>
                <p className="font-mono text-xs text-black/80 mt-1">
                  Persisted on MongoDB Atlas cluster
                </p>
              </div>
              <button
                onClick={() => setShowSavedDrawer(false)}
                className="w-8 h-8 border-2 border-lumen-black bg-black text-white font-press-start text-xs hover:bg-white hover:text-black flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Decks List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingDecks ? (
                <div className="text-center py-12 font-mono text-sm">
                  <span className="animate-spin inline-block mr-2">⚙️</span>
                  Connecting to MongoDB Atlas...
                </div>
              ) : savedDecks.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-3xl">📭</div>
                  <h4 className="font-press-start text-xs text-gray-700">
                    NO SAVED DECKS YET
                  </h4>
                  <p className="font-mono text-xs text-gray-500 max-w-xs mx-auto">
                    Generate flashcards and click &quot;SAVE&quot; to store them permanently in MongoDB Atlas.
                  </p>
                </div>
              ) : (
                savedDecks.map((deck) => {
                  const id = deck._id || deck.id || "";
                  return (
                    <div
                      key={id}
                      onClick={() => handleLoadDeck(deck)}
                      className="border-3 border-lumen-black p-4 bg-[#F9F9F6] hover:bg-[#00FFFF]/20 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-press-start text-[9px] px-1.5 py-0.5 bg-black text-[#FFCC00]">
                            {deck.sourceType || "DECK"}
                          </span>
                          <span className="font-mono text-[10px] text-gray-500">
                            {deck.totalCards || deck.flashcards?.length || 0} cards
                          </span>
                          {deck.createdAt && (
                            <span className="font-mono text-[10px] text-gray-400">
                              • {new Date(deck.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h4 className="font-press-start text-xs text-black truncate">
                          {deck.title}
                        </h4>
                        {deck.summary && (
                          <p className="font-mono text-xs text-gray-600 truncate max-w-md mt-0.5">
                            {deck.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-press-start text-[10px] px-2.5 py-1 bg-black text-[#FFCC00] border border-black group-hover:bg-[#FFCC00] group-hover:text-black transition-all">
                          LOAD &gt;
                        </span>
                        <button
                          onClick={(e) => handleDeleteDeck(id, e)}
                          title="Delete from MongoDB"
                          className="w-7 h-7 border border-black bg-white hover:bg-[#FF4F00] hover:text-white flex items-center justify-center font-mono text-xs transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 border-3 border-lumen-black bg-[#FFCC00] text-black font-press-start text-xs shadow-brutalist animate-bounce">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
