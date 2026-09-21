"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BACKEND_URL } from "@/utils/api";

type GameState = "input" | "loading" | "exploration" | "combat" | "victory" | "defeat" | "results";

interface Concept {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  gold: number;
}

interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  type: "ghost" | "demon" | "dragon" | "boss";
  color: string;
  defeated: boolean;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  damage: number;
  color: string;
}

export default function MemoryPalace() {
  const [gameState, setGameState] = useState<GameState>("input");
  const [inputType, setInputType] = useState<"youtube" | "pdf" | "text">("text");
  const [inputValue, setInputValue] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentDungeon, setCurrentDungeon] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Game state
  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 300,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    level: 1,
    experience: 0,
    gold: 0
  });
  
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }>>([]);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [showCombatUI, setShowCombatUI] = useState(false);
  const [attackAnimation, setAttackAnimation] = useState(false);
  const [enemyHitAnimation, setEnemyHitAnimation] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [currentCombatQuestion, setCurrentCombatQuestion] = useState<Question | null>(null);
  const [showAnswerChoices, setShowAnswerChoices] = useState(false);
  const particleIdCounter = useRef(0);
  const projectileIdCounter = useRef(0);
  
  const gameCanvasRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Initialize game content
  const handleStart = async () => {
    if (!inputValue.trim()) return;
    
    console.log("Starting adventure with:", inputValue);
    setGameState("loading");
    
    // Immediately load default content for demo
    const defaultConcepts: Concept[] = [
      {
        id: "1",
        title: `${inputValue} - Fundamentals`,
        description: `Learn the core concepts of ${inputValue} through dungeon exploration and combat.`,
        keyPoints: [
          `Understanding ${inputValue} basics`,
          `Practical applications`,
          `Key terminology`
        ]
      },
      {
        id: "2", 
        title: `${inputValue} - Advanced Concepts`,
        description: `Dive deeper into ${inputValue} with advanced techniques and strategies.`,
        keyPoints: [
          `Advanced methodologies`,
          `Real-world applications`,
          `Problem-solving techniques`
        ]
      },
      {
        id: "3",
        title: `${inputValue} - Mastery`,
        description: `Master ${inputValue} through challenging battles and complex scenarios.`,
        keyPoints: [
          `Expert-level knowledge`,
          `Complex problem solving`,
          `Innovative approaches`
        ]
      }
    ];
    
    const defaultQuestions: Question[] = [
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
    
    setConcepts(defaultConcepts);
    setQuestions(defaultQuestions);
    setCurrentDungeon(0);
    setCurrentQuestion(0);
    
    // Reset player
    setPlayer({
      x: 100,
      y: 300,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      level: 1,
      experience: 0,
      gold: 0
    });
    
    setCombatLog([]);
    
    // Force state update with delay
    setTimeout(() => {
      console.log("Transitioning to exploration state (default content)", {
        concepts: defaultConcepts.length,
        questions: defaultQuestions.length
      });
      setGameState("exploration");
    }, 500);
    
    // Try API call in background (non-blocking)
    setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/memory-palace/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: inputValue,
            type: inputType
          }),
        });
        
        const data = await response.json();
        
        if (data.success && data.concepts && data.concepts.length > 0) {
          console.log("API content loaded, updating...");
          setConcepts(data.concepts);
          setQuestions(data.questions || defaultQuestions);
        }
      } catch (error) {
        console.log("API call failed, using default content");
      }
    }, 1000);
  };

  // Game mechanics
  const spawnEnemy = () => {
    const enemyTypes = [
      { type: "ghost" as const, name: "Confusion Ghost", color: "#9C27B0", health: 50 },
      { type: "demon" as const, name: "Ignorance Demon", color: "#F44336", health: 75 },
      { type: "dragon" as const, name: "Knowledge Dragon", color: "#FF9800", health: 100 }
    ];
    
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const healthMultiplier = 1 + (currentDungeon * 0.3);
    
    setEnemy({
      id: `enemy-${particleIdCounter.current++}`,
      name: enemyType.name,
      health: enemyType.health * healthMultiplier,
      maxHealth: enemyType.health * healthMultiplier,
      x: 500 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      type: enemyType.type,
      color: enemyType.color,
      defeated: false
    });
    
    setGameState("combat");
    setShowCombatUI(true);
  };

  const playerAttack = (damage: number = 15) => {
    if (!enemy || enemy.defeated) return;
    
    setAttackAnimation(true);
    setTimeout(() => setAttackAnimation(false), 300);
    
    // Create projectile
    const projectile: Projectile = {
      id: projectileIdCounter.current++,
      x: player.x + 30,
      y: player.y + 15,
      targetX: enemy.x + 30,
      targetY: enemy.y + 30,
      damage: damage,
      color: "#FFD700"
    };
    
    setProjectiles(prev => [...prev, projectile]);
    
    // Damage enemy after projectile travel time
    setTimeout(() => {
      setEnemyHitAnimation(true);
      setTimeout(() => setEnemyHitAnimation(false), 200);
      
      setEnemy(prev => {
        if (!prev) return null;
        const newHealth = Math.max(0, prev.health - damage);
        const isDefeated = newHealth <= 0;
        
        if (isDefeated) {
          // Create victory particles
          createExplosion(enemy.x + 30, enemy.y + 30, enemy.color);
          addCombatLog(`💀 ${prev.name} defeated! +${Math.round(damage * 2)} XP`);
          
          // Award experience and gold
          setPlayer(prev => ({
            ...prev,
            experience: prev.experience + Math.round(damage * 2),
            gold: prev.gold + Math.round(damage)
          }));
          
          setTimeout(() => {
            setEnemy(null);
            setShowCombatUI(false);
            setGameState("exploration");
            
            // Check for level up
            if (player.experience >= player.level * 100) {
              levelUp();
            }
          }, 1500);
        }
        
        return prev ? { ...prev, health: newHealth, defeated: isDefeated } : null;
      });
      
      setProjectiles(prev => prev.filter(p => p.id !== projectile.id));
    }, 500);
  };

  const createExplosion = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: `particle-${particleIdCounter.current++}-${i}`,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      color: color,
      size: Math.random() * 15 + 5,
      life: 1.0
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  const addCombatLog = (message: string) => {
    setCombatLog(prev => [...prev, message].slice(-5));
  };

  const levelUp = () => {
    setPlayer(prev => ({
      ...prev,
      level: prev.level + 1,
      maxHealth: prev.maxHealth + 20,
      health: prev.maxHealth + 20,
      maxMana: prev.maxMana + 10,
      mana: prev.maxMana + 10,
      experience: 0
    }));
    addCombatLog(`🎉 Level Up! Now level ${player.level + 1}`);
  };

  const handleAnswerCombat = (answerIndex: number) => {
    if (!currentCombatQuestion) return;
    
    setShowAnswerChoices(false);
    
    if (answerIndex === currentCombatQuestion.correctAnswer) {
      // Correct answer - powerful attack
      playerAttack(35);
      addCombatLog("✅ Correct! Critical Hit!");
      
      // Restore some mana
      setPlayer(prev => ({
        ...prev,
        mana: Math.min(prev.maxMana, prev.mana + 10)
      }));
    } else {
      // Wrong answer - enemy attacks player
      if (enemy) {
        const damage = 15;
        setPlayer(prev => ({
          ...prev,
          health: Math.max(0, prev.health - damage)
        }));
        addCombatLog(`❌ Wrong! ${enemy.name} attacks for ${damage} damage!`);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
        
        if (player.health - damage <= 0) {
          setGameState("defeat");
        }
      }
    }
    
    // Move to next question or end combat
    setCurrentQuestion(prev => prev + 1);
    if (currentQuestion >= questions.length - 1) {
      setCurrentCombatQuestion(null);
    } else {
      // Next question appears after delay
      setTimeout(() => {
        setCurrentCombatQuestion(questions[currentQuestion + 1]);
        setShowAnswerChoices(true);
      }, 1000);
    }
  };

  const triggerCombatQuestion = () => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      setCurrentCombatQuestion(questions[currentQuestion]);
      setShowAnswerChoices(true);
    }
  };

  const handleRestart = () => {
    setGameState("input");
    setInputValue("");
    setConcepts([]);
    setQuestions([]);
    setCurrentDungeon(0);
    setCurrentQuestion(0);
    setEnemy(null);
    setProjectiles([]);
    setParticles([]);
    setCombatLog([]);
  };

  const handleGoBack = () => {
    setGameState("input");
  };

  // Game loop for particle animation
  useEffect(() => {
    const animate = () => {
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0);
      });
      
      if (animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Game HUD */}
      <nav className="w-full border-b-4 border-yellow-500 bg-gray-900 sticky top-0 z-50">
        <div className="px-4 py-2 flex items-center justify-between">
          <Link href="/dashboard" className="font-press-start text-sm text-yellow-500 hover:text-yellow-400 transition-colors">
            ← EXIT
          </Link>
          <div className="font-press-start text-sm text-yellow-500">
            MEMORY PALACE RPG
          </div>
          <div className="flex items-center gap-4">
            <div className="font-mono text-xs text-yellow-500">
              LVL {player.level}
            </div>
            <div className="font-mono text-xs text-yellow-500">
              💰 {player.gold}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative">
        {gameState === "input" && (
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="bg-gray-800 border-4 border-yellow-500 shadow-lg p-8 max-w-2xl w-full">
              <h1 className="font-press-start text-3xl text-yellow-500 mb-6 text-center">
                ⚔️ MEMORY PALACE RPG ⚔️
              </h1>
              
              <div className="mb-6">
                <label className="font-mono text-sm font-bold text-yellow-500 mb-2 block">
                  SELECT INPUT TYPE
                </label>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setInputType("text")}
                    className={`flex-1 border-2 border-yellow-500 p-3 font-press-start text-xs transition-all ${
                      inputType === "text" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-yellow-500 hover:bg-gray-600"
                    }`}
                  >
                    📜 TEXT
                  </button>
                  <button
                    onClick={() => setInputType("youtube")}
                    className={`flex-1 border-2 border-yellow-500 p-3 font-press-start text-xs transition-all ${
                      inputType === "youtube" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-yellow-500 hover:bg-gray-600"
                    }`}
                  >
                    🎥 YOUTUBE
                  </button>
                  <button
                    onClick={() => setInputType("pdf")}
                    className={`flex-1 border-2 border-yellow-500 p-3 font-press-start text-xs transition-all ${
                      inputType === "pdf" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-yellow-500 hover:bg-gray-600"
                    }`}
                  >
                    📄 PDF
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="font-mono text-sm font-bold text-yellow-500 mb-2 block">
                  {inputType === "text" ? "ENTER YOUR TOPIC" : inputType === "youtube" ? "PASTE YOUTUBE LINK" : "UPLOAD PDF"}
                </label>
                {inputType === "text" ? (
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter the topic you want to learn about..."
                    className="w-full border-2 border-yellow-500 p-4 font-mono text-sm bg-gray-700 text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[120px]"
                  />
                ) : inputType === "youtube" ? (
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border-2 border-yellow-500 p-4 font-mono text-sm bg-gray-700 text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                ) : (
                  <div className="border-2 border-yellow-500 p-8 bg-gray-700 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setInputValue(file.name);
                      }}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer font-press-start text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                    >
                      {inputValue || "📁 CLICK TO UPLOAD PDF"}
                    </label>
                  </div>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={!inputValue.trim()}
                className="w-full bg-yellow-500 border-2 border-yellow-500 p-4 font-press-start text-lg text-gray-900 hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                🎮 START ADVENTURE
              </button>
            </div>
          </div>
        )}

        {gameState === "loading" && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="bg-gray-800 border-4 border-yellow-500 shadow-lg p-8 text-center">
              <div className="font-press-start text-xl text-yellow-500 mb-4">
                ⚔️ GENERATING DUNGEON... ⚔️
              </div>
              <div className="w-full bg-gray-700 border-2 border-yellow-500 h-4 overflow-hidden">
                <div className="bg-yellow-500 h-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
              <p className="font-mono text-sm text-yellow-500 mt-4">
                Preparing your adventure...
              </p>
            </div>
          </div>
        )}

        {gameState === "exploration" && (
          <div className="relative h-screen bg-gray-900 overflow-hidden">
            {/* Game World */}
            <div className="absolute inset-0" ref={gameCanvasRef}>
              {/* Dungeon background */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900">
                {/* Dungeon floor pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="grid grid-cols-8 grid-rows-6 h-full">
                    {[...Array(48)].map((_, i) => (
                      <div key={i} className="border border-gray-600"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player Character */}
              <div 
                className="absolute w-16 h-16 transition-all duration-200"
                style={{ left: player.x, top: player.y }}
              >
                <div className="relative w-full h-full">
                  {/* Body */}
                  <div className="absolute inset-2 bg-yellow-500 rounded-lg border-2 border-yellow-300 shadow-lg">
                    {/* Eyes */}
                    <div className="absolute top-3 left-3 w-2 h-2 bg-gray-900 rounded-full"></div>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-gray-900 rounded-full"></div>
                    {/* Sword */}
                    <div className="absolute -right-4 top-4 w-8 h-2 bg-gray-400 rounded transform rotate-45"></div>
                  </div>
                  {/* Level indicator */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                    LVL {player.level}
                  </div>
                </div>
              </div>

              {/* Particles */}
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    opacity: particle.life,
                    transform: `scale(${particle.life})`
                  }}
                />
              ))}

              {/* Game UI Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                {/* Player Stats */}
                <div className="bg-gray-800 border-2 border-yellow-500 p-4 rounded-lg shadow-lg">
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-yellow-500 mb-1">
                      <span>HP</span>
                      <span>{player.health}/{player.maxHealth}</span>
                    </div>
                    <div className="w-32 h-2 bg-gray-700 rounded">
                      <div 
                        className="h-full bg-red-500 rounded transition-all"
                        style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-yellow-500 mb-1">
                      <span>MP</span>
                      <span>{player.mana}/{player.maxMana}</span>
                    </div>
                    <div className="w-32 h-2 bg-gray-700 rounded">
                      <div 
                        className="h-full bg-blue-500 rounded transition-all"
                        style={{ width: `${(player.mana / player.maxMana) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-500">
                    XP: {player.experience}/{player.level * 100}
                  </div>
                </div>

                {/* Combat Log */}
                <div className="bg-gray-800 border-2 border-yellow-500 p-4 rounded-lg shadow-lg max-w-xs">
                  <div className="text-xs text-yellow-500 mb-2 font-bold">COMBAT LOG</div>
                  <div className="space-y-1">
                    {combatLog.map((log, i) => (
                      <div key={i} className="text-xs text-gray-300">{log}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button
                  onClick={spawnEnemy}
                  className="bg-red-600 border-2 border-red-400 px-6 py-3 font-press-start text-sm text-white hover:bg-red-500 transition-all shadow-lg"
                >
                  ⚔️ FIGHT ENEMY
                </button>
                <button
                  onClick={() => {
                    if (concepts.length === 0) {
                      addCombatLog("⚠️ No dungeons available. Generate content first!");
                      return;
                    }
                    
                    if (currentDungeon < concepts.length - 1) {
                      setCurrentDungeon(prev => prev + 1);
                      addCombatLog(`🚪 Entering Dungeon ${currentDungeon + 2}...`);
                    } else {
                      addCombatLog("🏰 All dungeons cleared!");
                      setGameState("results");
                    }
                  }}
                  className="bg-blue-600 border-2 border-blue-400 px-6 py-3 font-press-start text-sm text-white hover:bg-blue-500 transition-all shadow-lg"
                >
                  🚪 NEXT DUNGEON
                </button>
              </div>

              {/* Current Dungeon Info */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border-2 border-yellow-500 px-4 py-2 rounded-lg">
                <div className="font-press-start text-sm text-yellow-500">
                  🏰 DUNGEON {currentDungeon + 1}/{Math.max(concepts.length, 1)}
                </div>
                {concepts.length > 0 && (
                  <div className="font-mono text-xs text-yellow-500 mt-1">
                    {concepts[currentDungeon]?.title || "Unknown Dungeon"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {gameState === "combat" && enemy && (
          <div className={`relative h-screen bg-gray-900 overflow-hidden ${screenShake ? 'animate-shake' : ''}`}>
            {/* Combat Arena */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900 to-gray-900">
              {/* Battle background effects */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
              </div>
            </div>

            {/* Particles */}
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute pointer-events-none rounded-full"
                style={{
                  left: particle.x,
                  top: particle.y,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  opacity: particle.life,
                  transform: `scale(${particle.life})`
                }}
              />
            ))}

            {/* Projectiles */}
            {projectiles.map((projectile) => (
              <div
                key={projectile.id}
                className="absolute w-4 h-4 rounded-full shadow-lg"
                style={{
                  left: projectile.x,
                  top: projectile.y,
                  backgroundColor: projectile.color,
                  boxShadow: `0 0 10px ${projectile.color}`
                }}
              />
            ))}

            {/* Player Character */}
            <div 
              className={`absolute w-20 h-20 transition-all duration-200 ${attackAnimation ? 'scale-110' : ''}`}
              style={{ left: player.x, top: player.y }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-2 bg-yellow-500 rounded-lg border-2 border-yellow-300 shadow-lg">
                  <div className="absolute top-4 left-4 w-3 h-3 bg-gray-900 rounded-full"></div>
                  <div className="absolute top-4 right-4 w-3 h-3 bg-gray-900 rounded-full"></div>
                  <div className="absolute -right-6 top-6 w-10 h-3 bg-gray-400 rounded transform rotate-45"></div>
                </div>
              </div>
            </div>

            {/* Enemy */}
            <div 
              className={`absolute w-24 h-24 transition-all duration-200 ${enemyHitAnimation ? 'scale-90' : ''}`}
              style={{ left: enemy.x, top: enemy.y }}
            >
              <div className="relative w-full h-full">
                <div 
                  className="absolute inset-0 rounded-lg border-4 border-red-500 shadow-lg"
                  style={{ backgroundColor: enemy.color }}
                >
                  {/* Enemy eyes */}
                  <div className="absolute top-6 left-6 w-4 h-4 bg-red-900 rounded-full animate-pulse"></div>
                  <div className="absolute top-6 right-6 w-4 h-4 bg-red-900 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                  
                  {/* Enemy mouth */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-red-900 rounded-full"></div>
                </div>
                
                {/* Enemy health bar */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32">
                  <div className="w-full h-2 bg-gray-700 rounded">
                    <div 
                      className="h-full bg-red-500 rounded transition-all"
                      style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-xs text-yellow-500 mt-1">
                    {enemy.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Combat UI */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {/* Player Stats */}
              <div className="bg-gray-800 border-2 border-yellow-500 p-4 rounded-lg shadow-lg">
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-yellow-500 mb-1">
                    <span>HP</span>
                    <span>{player.health}/{player.maxHealth}</span>
                  </div>
                  <div className="w-32 h-2 bg-gray-700 rounded">
                    <div 
                      className="h-full bg-red-500 rounded transition-all"
                      style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-yellow-500 mb-1">
                    <span>MP</span>
                    <span>{player.mana}/{player.maxMana}</span>
                  </div>
                  <div className="w-32 h-2 bg-gray-700 rounded">
                    <div 
                      className="h-full bg-blue-500 rounded transition-all"
                      style={{ width: `${(player.mana / player.maxMana) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Enemy Stats */}
              <div className="bg-gray-800 border-2 border-red-500 p-4 rounded-lg shadow-lg">
                <div className="text-xs text-red-500 mb-2 font-bold">{enemy.name}</div>
                <div className="w-32 h-2 bg-gray-700 rounded">
                  <div 
                    className="h-full bg-red-500 rounded transition-all"
                    style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-yellow-500 mt-1">
                  {enemy.health}/{enemy.maxHealth} HP
                </div>
              </div>
            </div>

            {/* Combat Actions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={() => playerAttack(15)}
                disabled={attackAnimation}
                className="bg-orange-600 border-2 border-orange-400 px-6 py-3 font-press-start text-sm text-white hover:bg-orange-500 transition-all shadow-lg disabled:opacity-50"
              >
                ⚔️ ATTACK (15 DMG)
              </button>
              <button
                onClick={() => {
                  if (player.mana >= 20) {
                    setPlayer(prev => ({ ...prev, mana: prev.mana - 20 }));
                    playerAttack(30);
                    addCombatLog("🔥 Fire Spell! 30 DMG");
                  }
                }}
                disabled={player.mana < 20 || attackAnimation}
                className="bg-purple-600 border-2 border-purple-400 px-6 py-3 font-press-start text-sm text-white hover:bg-purple-500 transition-all shadow-lg disabled:opacity-50"
              >
                🔥 FIRE SPELL (30 DMG)
              </button>
              <button
                onClick={triggerCombatQuestion}
                disabled={showAnswerChoices}
                className="bg-green-600 border-2 border-green-400 px-6 py-3 font-press-start text-sm text-white hover:bg-green-500 transition-all shadow-lg disabled:opacity-50"
              >
                📚 KNOWLEDGE ATTACK
              </button>
            </div>

            {/* Combat Question Modal */}
            {showCombatUI && currentCombatQuestion && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                <div className="bg-gray-800 border-4 border-yellow-500 p-8 max-w-2xl w-full mx-4 shadow-2xl">
                  <h2 className="font-press-start text-2xl text-yellow-500 mb-6 text-center">
                    📚 KNOWLEDGE BATTLE
                  </h2>
                  
                  <div className="bg-gray-700 border-2 border-yellow-500 p-6 mb-6">
                    <p className="font-mono text-sm text-yellow-500 leading-relaxed">
                      {currentCombatQuestion.question}
                    </p>
                  </div>

                  {showAnswerChoices && (
                    <div className="space-y-3 mb-6">
                      {currentCombatQuestion.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswerCombat(idx)}
                          className="w-full border-2 border-yellow-500 p-4 font-mono text-sm text-left transition-all bg-gray-700 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {!showAnswerChoices && (
                    <div className="text-center text-yellow-500 font-mono text-sm">
                      ⏳ Casting spell...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Combat Log */}
            <div className="absolute top-20 right-4 bg-gray-800 border-2 border-yellow-500 p-4 rounded-lg shadow-lg max-w-xs">
              <div className="text-xs text-yellow-500 mb-2 font-bold">COMBAT LOG</div>
              <div className="space-y-1">
                {combatLog.map((log, i) => (
                  <div key={i} className="text-xs text-gray-300">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState === "victory" && (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-600 to-yellow-800">
            <div className="bg-gray-800 border-4 border-yellow-500 p-8 text-center shadow-2xl">
              <h1 className="font-press-start text-4xl text-yellow-500 mb-6">
                🎉 VICTORY! 🎉
              </h1>
              <div className="space-y-4 mb-8">
                <div className="bg-gray-700 border-2 border-yellow-500 p-4">
                  <div className="font-press-start text-2xl text-yellow-500">
                    Level {player.level}
                  </div>
                  <div className="font-mono text-sm text-yellow-500">
                    {player.experience} XP
                  </div>
                </div>
                <div className="bg-gray-700 border-2 border-yellow-500 p-4">
                  <div className="font-press-start text-2xl text-yellow-500">
                    💰 {player.gold} Gold
                  </div>
                </div>
              </div>
              <button
                onClick={handleRestart}
                className="bg-yellow-500 border-2 border-yellow-500 px-8 py-4 font-press-start text-lg text-gray-900 hover:bg-yellow-400 transition-all shadow-lg"
              >
                🎮 PLAY AGAIN
              </button>
            </div>
          </div>
        )}

        {gameState === "defeat" && (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-900 to-gray-900">
            <div className="bg-gray-800 border-4 border-red-500 p-8 text-center shadow-2xl">
              <h1 className="font-press-start text-4xl text-red-500 mb-6">
                💀 DEFEATED 💀
              </h1>
              <p className="font-mono text-sm text-red-500 mb-8">
                The dungeon claims another soul...
              </p>
              <button
                onClick={handleRestart}
                className="bg-red-500 border-2 border-red-400 px-8 py-4 font-press-start text-lg text-white hover:bg-red-400 transition-all shadow-lg"
              >
                🔄 TRY AGAIN
              </button>
            </div>
          </div>
        )}

        {gameState === "results" && (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-600 to-yellow-800">
            <div className="bg-gray-800 border-4 border-yellow-500 p-8 max-w-2xl w-full mx-4 shadow-2xl">
              <h1 className="font-press-start text-3xl text-yellow-500 mb-6 text-center">
                🏰 DUNGEON COMPLETE 🏰
              </h1>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-700 border-2 border-yellow-500 p-4 text-center">
                  <div className="font-press-start text-3xl text-yellow-500 mb-2">
                    LVL {player.level}
                  </div>
                  <div className="font-mono text-sm text-yellow-500">
                    Final Level
                  </div>
                </div>
                <div className="bg-gray-700 border-2 border-yellow-500 p-4 text-center">
                  <div className="font-press-start text-3xl text-yellow-500 mb-2">
                    💰 {player.gold}
                  </div>
                  <div className="font-mono text-sm text-yellow-500">
                    Gold Earned
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 border-2 border-yellow-500 p-6 mb-8">
                <h2 className="font-press-start text-xl text-yellow-500 mb-4">
                  📊 ADVENTURE SUMMARY
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-sm text-yellow-500">
                    <span>Dungeons Cleared:</span>
                    <span>{concepts.length}/{concepts.length}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm text-yellow-500">
                    <span>Questions Mastered:</span>
                    <span>{questions.length}</span>
                  </div>
                  <div className="flex justify-between font-mono text-sm text-yellow-500">
                    <span>Total Experience:</span>
                    <span>{player.experience}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-yellow-500 border-2 border-yellow-500 p-4 font-press-start text-lg text-gray-900 hover:bg-yellow-400 transition-all shadow-lg"
                >
                  🎮 NEW ADVENTURE
                </button>
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-700 border-2 border-yellow-500 p-4 font-press-start text-lg text-yellow-500 hover:bg-gray-600 transition-all shadow-lg"
                >
                  🚪 EXIT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}