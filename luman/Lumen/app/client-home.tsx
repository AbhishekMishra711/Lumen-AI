"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const RETRO_COLORS = [
  "#FFCC00",
  "#00FFCC",
  "#FF00FF",
  "#00FF00",
  "#FF4444",
];

export default function ClientHome() {
  const [bgColor, setBgColor] = useState<string>("#FFCC00");

  useEffect(() => {
    const randomColor = RETRO_COLORS[Math.floor(Math.random() * RETRO_COLORS.length)];
    setBgColor(randomColor);
  }, []);

  return (
    <>
      {/* SECTION 1: HERO */}
      <section
        className="w-full border-b-4 border-lumen-black bg-dot-pattern flex flex-col"
        style={{
          backgroundColor: bgColor,
          backgroundSize: "20px 20px",
        }}
      >
        {/* Hero Tagline Section */}
        <div className="grid grid-cols-12 gap-0 border-b-4 border-lumen-black min-h-[50vh]">
          {/* Left: Tagline (8 columns) - Black Background */}
          <div className="col-span-12 md:col-span-8 border-r-4 border-lumen-black p-12 md:p-16 flex flex-col items-start justify-center bg-black">
            <h1
              className="font-black text-6xl md:text-7xl leading-none tracking-tighter text-white"
              style={{
                textShadow: "4px 4px 0px #FFCC00",
                letterSpacing: "-0.02em",
              }}
            >
              ILLUMINATE<br />YOUR<br />MIND.
            </h1>
            <p
              className="font-press-start text-xl md:text-3xl mt-6 leading-tight text-white"
              style={{
                textShadow: "2px 2px 0px #FFCC00",
              }}
            >
              ONE PIXEL AT A TIME.<span className="animate-blink text-lumen-yellow">_</span>
            </p>
          </div>

          {/* Right: Action Button (4 columns) - Neon Orange */}
          <div className="col-span-12 md:col-span-4 border-l-4 border-lumen-black p-8 flex flex-col items-center justify-center bg-[#FF4F00]">
            <Link
              href="/login"
              className="bg-white text-black font-press-start text-lg md:text-xl py-4 px-8 border-4 border-black transition-all duration-150 hover:-translate-y-1 hover:-translate-x-1 active:translate-x-2 active:translate-y-2 text-center block cursor-pointer"
              style={{
                boxShadow: "8px 8px 0px 0px #000000",
              }}
            >
              INITIATE
            </Link>
            <p className="font-mono text-xs mt-8 text-center leading-relaxed text-white font-bold">START YOUR<br />LEARNING<br />JOURNEY</p>
          </div>
        </div>

        {/* SELECT YOUR CLASS Grid - Bold Color-Blocked */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b-4 border-lumen-black">
          {/* Card 1: THE GRINDER - Yellow */}
          <Link
            href="/login"
            className="border-r-4 border-lumen-black bg-[#FFCC00] p-8 md:p-12 py-16 flex flex-col items-center justify-between min-h-[40vh] group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block cursor-pointer"
          >
            {/* SELECT Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300">
              <div className="font-press-start text-9xl text-black font-black">SELECT</div>
            </div>

            {/* HP Icon */}
            <div className="mb-6 relative z-10">
              <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
                <rect x="20" y="20" width="40" height="40" fill="#000000" stroke="#000000" strokeWidth="2"/>
                <rect x="28" y="28" width="8" height="24" fill="#FFCC00"/>
                <rect x="44" y="28" width="8" height="24" fill="#FFCC00"/>
                <rect x="28" y="52" width="24" height="4" fill="#FFCC00"/>
              </svg>
            </div>

            <div className="text-center flex-1 flex flex-col justify-center relative z-10">
              <h3 className="font-press-start text-3xl md:text-4xl mb-3 text-black font-black">THE GRINDER</h3>
              <p className="font-mono text-sm md:text-base leading-relaxed text-black font-bold">
                Flashcards &amp; Spaced Repetition
              </p>
            </div>

            <div className="mt-6 relative z-10 group-hover:block hidden">
              <div className="font-press-start text-sm text-black animate-blink text-center font-black">
                PRESS START
              </div>
            </div>
          </Link>

          {/* Card 2: THE SCHOLAR - Magenta */}
          <Link
            href="/login"
            className="border-r-4 border-lumen-black bg-[#FF00FF] p-8 md:p-12 py-16 flex flex-col items-center justify-between min-h-[40vh] group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block cursor-pointer"
          >
            {/* SELECT Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300">
              <div className="font-press-start text-9xl text-white font-black">SELECT</div>
            </div>

            {/* Mana Icon */}
            <div className="mb-6 relative z-10">
              <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
                <circle cx="40" cy="40" r="30" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>
                <path d="M 40 20 L 50 35 L 45 35 L 55 50 L 40 40 L 45 35 L 35 35 Z" fill="#FF00FF"/>
              </svg>
            </div>

            <div className="text-center flex-1 flex flex-col justify-center relative z-10">
              <h3 className="font-press-start text-3xl md:text-4xl mb-3 text-white font-black">THE SCHOLAR</h3>
              <p className="font-mono text-sm md:text-base leading-relaxed text-white font-bold">
                Semantic Note-Taking
              </p>
            </div>

            <div className="mt-6 relative z-10 group-hover:block hidden">
              <div className="font-press-start text-sm text-white animate-blink text-center font-black">
                PRESS START
              </div>
            </div>
          </Link>

          {/* Card 3: THE TACTICIAN - Cyan */}
          <Link
            href="/login"
            className="bg-[#00FFFF] p-8 md:p-12 py-16 flex flex-col items-center justify-between min-h-[40vh] group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden block cursor-pointer"
          >
            {/* SELECT Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300">
              <div className="font-press-start text-9xl text-black font-black">SELECT</div>
            </div>

            {/* Sword/Shield Icon */}
            <div className="mb-6 relative z-10">
              <svg width="96" height="96" viewBox="0 0 80 80" style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,1))" }}>
                <path d="M 40 10 L 60 25 L 60 45 Q 60 65 40 70 Q 20 65 20 45 L 20 25 Z" fill="#000000" stroke="#000000" strokeWidth="2"/>
                <line x1="35" y1="25" x2="45" y2="50" stroke="#00FFFF" strokeWidth="3"/>
                <line x1="45" y1="25" x2="35" y2="50" stroke="#00FFFF" strokeWidth="3"/>
              </svg>
            </div>

            <div className="text-center flex-1 flex flex-col justify-center relative z-10">
              <h3 className="font-press-start text-3xl md:text-4xl mb-3 text-black font-black">THE TACTICIAN</h3>
              <p className="font-mono text-sm md:text-base leading-relaxed text-black font-bold">
                Automated RAG Quizzes
              </p>
            </div>

            <div className="mt-6 relative z-10 group-hover:block hidden">
              <div className="font-press-start text-sm text-black animate-blink text-center font-black">
                PRESS START
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 2: THE QUEST BOARD */}
      <section className="w-full border-t-4 border-b-4 border-lumen-black py-16 px-8" style={{ backgroundColor: "#00FFFF" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-press-start text-5xl md:text-6xl mb-12 leading-none" style={{ textShadow: "6px 6px 0px #000000" }}>
            ACTIVE QUESTS
          </h2>

          {/* Quest Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quest 1 */}
            <div className="bg-lumen-yellow border-4 border-lumen-black p-6 shadow-brutalist">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-press-start text-lg">DEFEAT THE MIDTERM</h3>
                <div className="bg-lumen-black text-white px-2 py-1 font-press-start text-xs">+500 XP</div>
              </div>
              <p className="font-mono text-sm mb-4">Master 8/10 practice problems</p>

              {/* Progress Bar */}
              <div className="border-2 border-lumen-black bg-white mb-4">
                <div className="bg-lumen-black h-4" style={{ width: "60%" }}></div>
              </div>
              <p className="font-mono text-xs text-right">60%</p>
            </div>

            {/* Quest 2 */}
            <div className="bg-[#FF00FF] border-4 border-lumen-black p-6 shadow-brutalist">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-press-start text-lg text-white">ANALYZE CHAPTER 4</h3>
                <div className="bg-lumen-black text-white px-2 py-1 font-press-start text-xs">+300 XP</div>
              </div>
              <p className="font-mono text-sm text-white mb-4">Complete semantic notes</p>

              {/* Progress Bar */}
              <div className="border-2 border-lumen-black bg-white mb-4">
                <div className="bg-lumen-black h-4" style={{ width: "85%" }}></div>
              </div>
              <p className="font-mono text-xs text-right text-white">85%</p>
            </div>

            {/* Quest 3 */}
            <div className="bg-[#39FF14] border-4 border-lumen-black p-6 shadow-brutalist">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-press-start text-lg">FOCUS MARATHON</h3>
                <div className="bg-lumen-black text-white px-2 py-1 font-press-start text-xs">+250 XP</div>
              </div>
              <p className="font-mono text-sm mb-4">Study 4 hours uninterrupted</p>

              {/* Progress Bar */}
              <div className="border-2 border-lumen-black bg-white mb-4">
                <div className="bg-lumen-black h-4" style={{ width: "40%" }}></div>
              </div>
              <p className="font-mono text-xs text-right">40%</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE NEURAL FORGE */}
      <section className="w-full border-t-4 border-b-4 border-lumen-black py-16 px-8" style={{ backgroundColor: "#FFCC00" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-press-start text-5xl md:text-6xl mb-12 leading-none" style={{ textShadow: "6px 6px 0px #000000" }}>
            AI COMPANION STATS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Stat Blocks */}
            <div className="space-y-4">
              {/* Stat Block 1 */}
              <div className="bg-white border-4 border-lumen-black p-6 shadow-brutalist">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-press-start text-sm">KNOWLEDGE RETENTION</span>
                  <span className="font-press-start text-lg">87%</span>
                </div>
                <div className="border-2 border-lumen-black bg-white">
                  <div className="bg-lumen-black h-4" style={{ width: "87%" }}></div>
                </div>
              </div>

              {/* Stat Block 2 */}
              <div className="bg-white border-4 border-lumen-black p-6 shadow-brutalist">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-press-start text-sm">FOCUS STAMINA</span>
                  <span className="font-press-start text-lg">LEVEL 4</span>
                </div>
                <div className="border-2 border-lumen-black bg-white">
                  <div className="bg-lumen-black h-4" style={{ width: "75%" }}></div>
                </div>
              </div>

              {/* Stat Block 3 */}
              <div className="bg-white border-4 border-lumen-black p-6 shadow-brutalist">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-press-start text-sm">STUDY STREAK</span>
                  <span className="font-press-start text-lg">🔥 14 DAYS</span>
                </div>
                <div className="border-2 border-lumen-black bg-white">
                  <div className="bg-lumen-black h-4" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>

            {/* Right: Insights Terminal */}
            <div className="bg-lumen-black border-4 border-lumen-black p-6 shadow-brutalist flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="font-press-start text-xs text-[#00FF00] mb-4">NEURAL INSIGHTS</div>
                <div className="font-mono text-xs text-[#00FF00] leading-relaxed">
                  <p>→ Peak focus detected: 2-4 PM</p>
                  <p>→ Recommended study: Semantics</p>
                  <p>→ Topic mastery rising: Calculus</p>
                  <p>→ Weak area detected: Biology</p>
                  <p>→ Schedule break in 30 mins</p>
                </div>
              </div>
              <div className="text-[#00FF00] font-mono text-xs animate-blink">
                █
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HIGH SCORES */}
      <section className="w-full border-t-4 border-b-4 border-lumen-black py-16 px-8" style={{ backgroundColor: "#39FF14" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-press-start text-5xl md:text-6xl mb-12 leading-none" style={{ textShadow: "6px 6px 0px #000000" }}>
            GLOBAL LEADERBOARD
          </h2>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-4 border-collapse border-lumen-black">
              <thead>
                <tr className="bg-lumen-black text-white">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">RANK</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">PLAYER</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">STREAK</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">TOTAL XP</td>
                </tr>
              </thead>
              <tbody>
                {/* Gold: Rank 1 */}
                <tr className="bg-[#FFD700]">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg font-bold">🥇 1</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">StudyNinja99</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 42 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">125,500</td>
                </tr>

                {/* Silver: Rank 2 */}
                <tr className="bg-[#C0C0C0]">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg font-bold">🥈 2</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">MindForge42</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 38 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">118,200</td>
                </tr>

                {/* Bronze: Rank 3 */}
                <tr className="bg-[#CD7F32]">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg font-bold">🥉 3</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">EliteScholar</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 35 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">112,800</td>
                </tr>

                {/* Regular Rows */}
                <tr className="bg-white">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg">4</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">PixelScholar</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 28 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">105,300</td>
                </tr>

                <tr className="bg-white">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg">5</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">RetroMentor</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 21 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">98,600</td>
                </tr>

                <tr className="bg-white">
                  <td className="border-4 border-lumen-black p-4 font-press-start text-lg">6</td>
                  <td className="border-4 border-lumen-black p-4 font-mono text-sm">DataPhilosopher</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">🔥 18 DAYS</td>
                  <td className="border-4 border-lumen-black p-4 font-press-start text-sm">92,400</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: THE TERMINAL / FOOTER */}
      <section className="w-full border-t-4 border-lumen-black" style={{ backgroundColor: "#000000" }}>
        {/* Main Footer Content */}
        <div className="py-16 px-8 border-b-4 border-lumen-black">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Left Column: Command Directory */}
            <div>
              <h3 className="font-press-start text-lg mb-6" style={{ color: "#39FF14" }}>
                COMMAND DIRECTORY
              </h3>
              <div className="space-y-3 font-mono text-sm" style={{ color: "#39FF14" }}>
                <a href="#" className="block hover:text-white transition group">
                  <span className="group-hover:animate-blink">_</span> /about_us
                </a>
                <a href="#" className="block hover:text-white transition group">
                  <span className="group-hover:animate-blink">_</span> /our_story
                </a>
                <a href="#" className="block hover:text-white transition group">
                  <span className="group-hover:animate-blink">_</span> /documentation
                </a>
                <a href="#" className="block hover:text-white transition group">
                  <span className="group-hover:animate-blink">_</span> /patch_notes
                </a>
              </div>
            </div>

            {/* Middle Column: Communications */}
            <div>
              <h3 className="font-press-start text-lg mb-6" style={{ color: "#39FF14" }}>
                COMMUNICATIONS
              </h3>
              <div className="space-y-3 font-mono text-sm" style={{ color: "#39FF14" }}>
                <a href="mailto:hello@lumen.ai" className="block hover:text-white transition">
                  &gt; contact@lumen.ai
                </a>
                <a href="#" className="block hover:text-white transition">
                  &gt; discord.gg/lumen
                </a>
                <a href="#" className="block hover:text-white transition">
                  &gt; @lumenai_
                </a>
              </div>
            </div>

            {/* Right Column: Logo/Branding */}
            <div className="flex flex-col items-center justify-center">
              <div className="font-press-start text-4xl mb-4" style={{ color: "#39FF14" }}>
                LUMEN
              </div>
              <div className="font-mono text-xs" style={{ color: "#39FF14" }}>
                <div>████████████████</div>
                <div>█  AI NATIVE  █</div>
                <div>█ STUDY TOOL  █</div>
                <div>████████████████</div>
              </div>
              <p className="font-mono text-xs mt-4" style={{ color: "#39FF14" }}>
                v1.0 BETA
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="border-t-4 border-lumen-black py-4 px-8 text-center" style={{ backgroundColor: "#000000" }}>
          <p className="font-mono text-xs" style={{ color: "#39FF14" }}>
            © 2026 LUMEN SYSTEMS. ALL YOUR BASE ARE BELONG TO US.
          </p>
        </div>
      </section>
    </>
  );
}
