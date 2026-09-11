"use client";

import { useState } from "react";
import { selectClass } from "./actions";

const CLASSES = [
  {
    id: "grinder",
    name: "THE GRINDER",
    description: "Master Flashcards & Spaced Repetition",
    color: "#FFCC00",
    textColor: "#000000",
    icon: (
      <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
        <rect x="20" y="20" width="40" height="40" fill="#000000" stroke="#000000" strokeWidth="2"/>
        <rect x="28" y="28" width="8" height="24" fill="#FFCC00"/>
        <rect x="44" y="28" width="8" height="24" fill="#FFCC00"/>
        <rect x="28" y="52" width="24" height="4" fill="#FFCC00"/>
      </svg>
    ),
  },
  {
    id: "scholar",
    name: "THE SCHOLAR",
    description: "Expert in Semantic Note-Taking",
    color: "#FF00FF",
    textColor: "#FFFFFF",
    icon: (
      <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
        <circle cx="40" cy="40" r="30" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
        <path d="M 40 20 L 50 35 L 45 35 L 55 50 L 40 40 L 45 35 L 35 35 Z" fill="#FF00FF"/>
      </svg>
    ),
  },
  {
    id: "tactician",
    name: "THE TACTICIAN",
    description: "Conquer Automated RAG Quizzes",
    color: "#00FFFF",
    textColor: "#000000",
    icon: (
      <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
        <path d="M 40 10 L 60 25 L 60 45 Q 60 65 40 70 Q 20 65 20 45 L 20 25 Z" fill="#000000" stroke="#000000" strokeWidth="2"/>
        <line x1="35" y1="25" x2="45" y2="50" stroke="#00FFFF" strokeWidth="3"/>
        <line x1="45" y1="25" x2="35" y2="50" stroke="#00FFFF" strokeWidth="3"/>
      </svg>
    ),
  },
];

export default function OnboardingPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectClass = async (classId: string) => {
    setSelectedClass(classId);
    setLoading(true);
    await selectClass(classId);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1
          className="font-press-start text-5xl md:text-6xl mb-4"
          style={{ color: "#39FF14", textShadow: "6px 6px 0px #FFCC00" }}
        >
          SELECT YOUR CLASS
        </h1>
        <p className="font-mono text-sm" style={{ color: "#39FF14" }}>
          &gt; CHOOSE YOUR STUDY MODE TO BEGIN YOUR JOURNEY
        </p>
      </div>

      {/* Class Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {CLASSES.map((classOption) => (
          <button
            key={classOption.id}
            onClick={() => handleSelectClass(classOption.id)}
            disabled={loading}
            className="transition-all duration-300 transform hover:-translate-y-2 disabled:opacity-50"
            style={{
              backgroundColor: classOption.color,
            }}
          >
            <div
              className="border-4 border-lumen-black p-8 flex flex-col items-center justify-center min-h-[400px] relative group"
              style={{
                boxShadow: selectedClass === classOption.id ? "12px 12px 0px #FFCC00" : "8px 8px 0px #000000",
              }}
            >
              {/* Selection Indicator */}
              {selectedClass === classOption.id && (
                <div
                  className="absolute top-4 right-4 w-6 h-6 border-3 flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor: classOption.color,
                    borderColor: "#000000",
                    color: "#000000",
                  }}
                >
                  ✓
                </div>
              )}

              {/* Icon */}
              <div className="mb-6">{classOption.icon}</div>

              {/* Class Name */}
              <h2
                className="font-press-start text-xl mb-3 text-center"
                style={{ color: classOption.textColor }}
              >
                {classOption.name}
              </h2>

              {/* Description */}
              <p
                className="font-mono text-xs text-center leading-relaxed mb-6"
                style={{ color: classOption.textColor }}
              >
                {classOption.description}
              </p>

              {/* Placeholder Stats */}
              <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono" style={{ color: classOption.textColor }}>
                <div className="border border-current p-2 text-center">ATK: 7</div>
                <div className="border border-current p-2 text-center">DEF: 8</div>
                <div className="border border-current p-2 text-center">SPD: 6</div>
                <div className="border border-current p-2 text-center">INT: 9</div>
              </div>

              {/* Selection Button */}
              <button
                className="mt-6 px-6 py-3 bg-lumen-black text-white border-2 border-lumen-black font-press-start text-xs transition-all hover:bg-white hover:text-lumen-black"
                style={{
                  boxShadow: "4px 4px 0px #000000",
                }}
                onClick={() => handleSelectClass(classOption.id)}
                disabled={loading}
              >
                {selectedClass === classOption.id && loading ? "CONFIRMING..." : "SELECT"}
              </button>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Message */}
      <div className="mt-12 text-center">
        <p className="font-mono text-xs" style={{ color: "#39FF14" }}>
          &gt; YOUR CHOICE WILL DEFINE YOUR LEARNING PATH
        </p>
      </div>
    </div>
  );
}
