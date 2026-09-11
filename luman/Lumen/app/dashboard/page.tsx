"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Top Navigation Bar */}
      <nav className="w-full border-b-4 border-lumen-black bg-[#F4F4F0] sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/dashboard" className="font-press-start text-2xl text-black hover:opacity-80 transition-opacity">
            LUMEN
          </Link>

          {/* Right: User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              className="p-2 hover:bg-lumen-yellow transition-all"
            >
              {/* Pixelated Smiley Face Avatar */}
              <svg width="40" height="40" viewBox="0 0 40 40" className="inline-block">
                <rect x="5" y="5" width="30" height="30" fill="#000000" stroke="#000000" strokeWidth="2"/>
                <rect x="12" y="14" width="4" height="4" fill="#FFCC00"/>
                <rect x="24" y="14" width="4" height="4" fill="#FFCC00"/>
                <rect x="14" y="22" width="12" height="2" fill="#FFCC00"/>
              </svg>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-12 right-0 bg-white border-4 border-lumen-black shadow-brutalist min-w-[180px]">
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

      {/* Main Canvas - Bento Grid */}
      <div className="p-12 md:p-20">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 auto-rows-[300px] max-w-7xl mx-auto">
          {/* Module 1: MIND MAP - Top Left (Cyan) */}
          <Link
            href="/dashboard/mindmap"
            className="bg-[#00FFFF] border-4 border-lumen-black p-6 flex flex-col items-center justify-between shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group block"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
              <circle cx="40" cy="40" r="8" fill="#000000"/>
              <line x1="40" y1="40" x2="20" y2="20" stroke="#000000" strokeWidth="2"/>
              <line x1="40" y1="40" x2="60" y2="20" stroke="#000000" strokeWidth="2"/>
              <line x1="40" y1="40" x2="20" y2="60" stroke="#000000" strokeWidth="2"/>
              <line x1="40" y1="40" x2="60" y2="60" stroke="#000000" strokeWidth="2"/>
              <circle cx="20" cy="20" r="4" fill="#000000"/>
              <circle cx="60" cy="20" r="4" fill="#000000"/>
              <circle cx="20" cy="60" r="4" fill="#000000"/>
              <circle cx="60" cy="60" r="4" fill="#000000"/>
            </svg>
            <h3 className="font-press-start text-sm text-lumen-black text-center">MIND MAP</h3>
          </Link>

          {/* Module 2: FLASHCARDS - Top Right (Magenta) */}
          <Link
            href="/dashboard/flashcards"
            className="bg-[#FF00FF] border-4 border-lumen-black p-6 flex flex-col items-center justify-between shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer block"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
              <rect x="20" y="20" width="40" height="40" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
              <line x1="30" y1="20" x2="30" y2="60" stroke="#000000" strokeWidth="1"/>
              <line x1="40" y1="20" x2="40" y2="60" stroke="#000000" strokeWidth="1"/>
              <line x1="50" y1="20" x2="50" y2="60" stroke="#000000" strokeWidth="1"/>
              <line x1="20" y1="35" x2="60" y2="35" stroke="#000000" strokeWidth="1"/>
              <line x1="20" y1="50" x2="60" y2="50" stroke="#000000" strokeWidth="1"/>
            </svg>
            <h3 className="font-press-start text-sm text-white text-center">FLASHCARDS</h3>
          </Link>

          {/* Module 3: QUIZ - Bottom Left (Lime Green) */}
          <div className="bg-[#39FF14] border-4 border-lumen-black p-6 flex flex-col items-center justify-between shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
              <circle cx="40" cy="40" r="25" fill="#000000" stroke="#000000" strokeWidth="2"/>
              <text x="40" y="50" textAnchor="middle" fontSize="24" fill="#39FF14" fontWeight="bold">?</text>
            </svg>
            <h3 className="font-press-start text-sm text-lumen-black text-center">QUIZ</h3>
          </div>

          {/* Module 4: AI TUTOR - Bottom Right (Yellow) */}
          <Link href="/dashboard/ai-tutor" className="bg-[#FFCC00] border-4 border-lumen-black p-6 flex flex-col items-center justify-between shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer block">
            <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
              <circle cx="40" cy="35" r="15" fill="#000000" stroke="#000000" strokeWidth="2"/>
              <rect x="30" y="50" width="20" height="20" fill="#000000" stroke="#000000" strokeWidth="2"/>
              <rect x="22" y="50" width="6" height="10" fill="#000000"/>
              <rect x="52" y="50" width="6" height="10" fill="#000000"/>
            </svg>
            <h3 className="font-press-start text-sm text-lumen-black text-center">AI TUTOR</h3>
          </Link>

          {/* Module 5: MEMORY PALACE - Center (Orange, 2x2) */}
          <div className="md:col-span-2 md:row-span-2 bg-[#FF4F00] border-4 border-lumen-black p-8 flex flex-col items-center justify-center shadow-brutalist hover:-translate-x-1 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer md:col-start-2 md:row-start-1">
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: "drop-shadow(6px 6px 0 rgba(0,0,0,1))" }} className="mb-6">
              <rect x="20" y="20" width="80" height="80" fill="#000000" stroke="#000000" strokeWidth="2"/>
              <circle cx="40" cy="40" r="8" fill="#FFCC00"/>
              <circle cx="60" cy="40" r="8" fill="#FFCC00"/>
              <circle cx="80" cy="40" r="8" fill="#FFCC00"/>
              <circle cx="40" cy="60" r="8" fill="#FFCC00"/>
              <circle cx="60" cy="60" r="8" fill="#FFCC00"/>
              <circle cx="80" cy="60" r="8" fill="#FFCC00"/>
              <circle cx="40" cy="80" r="8" fill="#FFCC00"/>
              <circle cx="60" cy="80" r="8" fill="#FFCC00"/>
              <circle cx="80" cy="80" r="8" fill="#FFCC00"/>
            </svg>
            <h2 className="font-press-start text-2xl text-lumen-black text-center">MEMORY PALACE</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
