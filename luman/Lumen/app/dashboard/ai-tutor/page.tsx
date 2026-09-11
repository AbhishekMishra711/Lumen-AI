"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  extractFromPDF,
  extractFromPPTX,
  extractFromYouTube,
  extractFromText,
  generateTutorCurriculum,
} from "@/app/dashboard/ai-tutor/actions";

type InputMode = "file" | "youtube" | "text" | null;
type FileType = "pdf" | "pptx" | null;

export default function AiTutorUploadPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", file);

      let extractionResult;
      if (fileType === "pdf") {
        extractionResult = await extractFromPDF(formData);
      } else if (fileType === "pptx") {
        extractionResult = await extractFromPPTX(formData);
      } else {
        throw new Error("INVALID FILE TYPE");
      }

      if (!extractionResult.success || !extractionResult.text) {
        throw new Error(extractionResult.error || "EXTRACTION FAILED");
      }

      // Generate curriculum and create session
      const genResult = await generateTutorCurriculum(
        extractionResult.text,
        fileType,
        customTopic || undefined
      );

      if (!genResult.success || !genResult.session) {
        throw new Error(genResult.error || "CURRICULUM GENERATION FAILED");
      }

      // Redirect to play page
      router.push(`/dashboard/ai-tutor/play/${genResult.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "UNKNOWN ERROR");
      setLoading(false);
    }
  }

  async function handleYouTubeSubmit() {
    const urlInput = document.getElementById("youtube-url") as HTMLInputElement;
    const url = urlInput?.value.trim();

    if (!url) {
      setError("YOUTUBE URL REQUIRED");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const extractionResult = await extractFromYouTube(url);

      if (!extractionResult.success || !extractionResult.text) {
        throw new Error(extractionResult.error || "TRANSCRIPT EXTRACTION FAILED");
      }

      // Generate curriculum and create session
      const genResult = await generateTutorCurriculum(
        extractionResult.text,
        "youtube",
        customTopic || undefined
      );

      if (!genResult.success || !genResult.session) {
        throw new Error(genResult.error || "CURRICULUM GENERATION FAILED");
      }

      router.push(`/dashboard/ai-tutor/play/${genResult.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "UNKNOWN ERROR");
      setLoading(false);
    }
  }

  async function handleTextSubmit() {
    const textInput = document.getElementById("raw-text") as HTMLTextAreaElement;
    const text = textInput?.value.trim();

    if (!text) {
      setError("TEXT INPUT REQUIRED");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const extractionResult = await extractFromText(text);

      if (!extractionResult.success || !extractionResult.text) {
        throw new Error(extractionResult.error || "TEXT PROCESSING FAILED");
      }

      // Generate curriculum and create session
      const genResult = await generateTutorCurriculum(
        extractionResult.text,
        "text",
        customTopic || undefined
      );

      if (!genResult.success || !genResult.session) {
        throw new Error(genResult.error || "CURRICULUM GENERATION FAILED");
      }

      router.push(`/dashboard/ai-tutor/play/${genResult.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "UNKNOWN ERROR");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-lumen-yellow">
      {/* Top bar */}
      <div className="border-b-4 border-lumen-black bg-lumen-yellow sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-press-start text-xs hover:opacity-70 transition-opacity"
        >
          &larr; DASHBOARD
        </Link>
        <h1 className="font-press-start text-xs md:text-sm text-center">
          AI TUTOR INGESTION
        </h1>
        <div className="w-20" />
      </div>

      <div className="p-6 md:p-12 max-w-2xl mx-auto">
        {!inputMode ? (
          // Mode selection
          <div className="space-y-4">
            <h2 className="font-press-start text-sm md:text-base mb-8">
              SELECT INPUT SOURCE
            </h2>

            <button
              onClick={() => {
                setInputMode("file");
                setFileType("pdf");
              }}
              className="w-full p-6 bg-white border-4 border-lumen-black shadow-brutalist hover:bg-lumen-black hover:text-white transition-all"
            >
              <p className="font-press-start text-xs mb-2">📄 PDF UPLOAD</p>
              <p className="font-mono text-sm">Upload a PDF document</p>
            </button>

            <button
              onClick={() => {
                setInputMode("file");
                setFileType("pptx");
              }}
              className="w-full p-6 bg-white border-4 border-lumen-black shadow-brutalist hover:bg-lumen-black hover:text-white transition-all"
            >
              <p className="font-press-start text-xs mb-2">🎬 POWERPOINT UPLOAD</p>
              <p className="font-mono text-sm">Upload a PPTX presentation</p>
            </button>

            <button
              onClick={() => setInputMode("youtube")}
              className="w-full p-6 bg-white border-4 border-lumen-black shadow-brutalist hover:bg-lumen-black hover:text-white transition-all"
            >
              <p className="font-press-start text-xs mb-2">📺 YOUTUBE VIDEO</p>
              <p className="font-mono text-sm">Paste a YouTube video URL</p>
            </button>

            <button
              onClick={() => setInputMode("text")}
              className="w-full p-6 bg-white border-4 border-lumen-black shadow-brutalist hover:bg-lumen-black hover:text-white transition-all"
            >
              <p className="font-press-start text-xs mb-2">✏️ RAW TEXT</p>
              <p className="font-mono text-sm">Paste raw text or notes</p>
            </button>
          </div>
        ) : (
          // Input form
          <div className="space-y-4">
            <button
              onClick={() => {
                setInputMode(null);
                setFileType(null);
                setError(null);
              }}
              disabled={loading}
              className="font-press-start text-xs mb-4 hover:opacity-70 transition-opacity"
            >
              ← BACK
            </button>

            <h2 className="font-press-start text-sm md:text-base mb-6">
              {inputMode === "file" && `UPLOAD ${fileType?.toUpperCase()}`}
              {inputMode === "youtube" && "YOUTUBE URL"}
              {inputMode === "text" && "RAW TEXT"}
            </h2>

            {/* File upload */}
            {inputMode === "file" && (
              <div className="border-4 border-lumen-black p-6 bg-white shadow-brutalist">
                <label
                  htmlFor="file-input"
                  className="block cursor-pointer text-center py-8 border-2 border-dashed border-lumen-black hover:bg-lumen-yellow transition-all"
                >
                  <p className="font-press-start text-xs mb-2">CLICK TO UPLOAD</p>
                  <p className="font-mono text-sm">or drag and drop</p>
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept={fileType === "pdf" ? ".pdf" : ".pptx"}
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="hidden"
                />
              </div>
            )}

            {/* YouTube URL */}
            {inputMode === "youtube" && (
              <div className="border-4 border-lumen-black p-6 bg-white shadow-brutalist space-y-4">
                <input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={loading}
                  className="w-full p-3 border-2 border-lumen-black font-mono text-sm"
                />
                <button
                  onClick={handleYouTubeSubmit}
                  disabled={loading}
                  className="w-full px-5 py-3 bg-lumen-black text-lumen-yellow border-4 border-lumen-black font-press-start text-xs shadow-brutalist hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {loading ? "FETCHING..." : "FETCH TRANSCRIPT"}
                </button>
              </div>
            )}

            {/* Raw text */}
            {inputMode === "text" && (
              <div className="border-4 border-lumen-black p-6 bg-white shadow-brutalist space-y-4">
                <textarea
                  id="raw-text"
                  placeholder="Paste your text here..."
                  disabled={loading}
                  rows={10}
                  className="w-full p-3 border-2 border-lumen-black font-mono text-sm resize-none"
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={loading}
                  className="w-full px-5 py-3 bg-lumen-black text-lumen-yellow border-4 border-lumen-black font-press-start text-xs shadow-brutalist hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {loading ? "GENERATING..." : "GENERATE CURRICULUM"}
                </button>
              </div>
            )}

            {/* Custom topic */}
            <div className="border-4 border-lumen-black p-4 bg-white shadow-brutalist">
              <label className="block font-press-start text-xs mb-2">
                OPTIONAL FOCUS TOPIC
              </label>
              <input
                type="text"
                placeholder="e.g., focus on chapters 3-5"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                disabled={loading}
                className="w-full p-3 border-2 border-lumen-black font-mono text-sm"
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="border-4 border-lumen-black bg-[#FF4444] text-white p-4 shadow-brutalist">
                <p className="font-press-start text-xs mb-2">ERROR</p>
                <p className="font-mono text-sm">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="border-4 border-lumen-black bg-lumen-yellow p-6 text-center shadow-brutalist">
                <p className="font-press-start text-xs animate-blink">
                  KNIGHT MENTOR IS PREPARING...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
