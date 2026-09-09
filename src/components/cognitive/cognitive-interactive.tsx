"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Brain,
  Zap,
  Grid,
  Palette,
  Calculator,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recordCognitiveAttemptAction } from "@/app/actions/cognitive";

interface GameHighScores {
  memory_matrix: number;
  stroop_test: number;
  speed_math: number;
}

interface CognitiveInteractiveProps {
  highScores: GameHighScores;
}

export function CognitiveInteractive({ highScores: initialHighScores }: CognitiveInteractiveProps) {
  const [highScores, setHighScores] = useState<GameHighScores>(initialHighScores);
  const [activeGame, setActiveGame] = useState<"memory_matrix" | "stroop_test" | "speed_math" | null>(
    null
  );

  // Common Game State
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameOver, setGameOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Memory Matrix Specific
  const [matrixPattern, setMatrixPattern] = useState<number[]>([]);
  const [matrixRevealed, setMatrixRevealed] = useState(false);
  const [matrixSelected, setMatrixSelected] = useState<number[]>([]);

  // Stroop Test Specific
  const STROOP_COLORS = [
    { name: "RED", hex: "#ef4444" },
    { name: "BLUE", hex: "#3b82f6" },
    { name: "GREEN", hex: "#22c55e" },
    { name: "YELLOW", hex: "#eab308" },
    { name: "PURPLE", hex: "#a855f7" },
  ];
  const [stroopWord, setStroopWord] = useState<{ text: string; colorHex: string; colorName: string }>({
    text: "BLUE",
    colorHex: "#ef4444",
    colorName: "RED",
  });

  // Speed Math Specific
  const [mathQuestion, setMathQuestion] = useState<{
    text: string;
    options: number[];
    answer: number;
  }>({ text: "12 + 15", options: [27, 25, 29, 31], answer: 27 });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer runner for timed games (Stroop & Speed Math)
  useEffect(() => {
    if (activeGame && (activeGame === "stroop_test" || activeGame === "speed_math") && !gameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [activeGame, gameOver]);

  // Handle Game Over submission
  const handleGameEnd = async (finalScore: number, finalLevel: number) => {
    setGameOver(true);
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    if (activeGame) {
      try {
        const res = await recordCognitiveAttemptAction({
          gameType: activeGame,
          score: finalScore,
          levelReached: finalLevel,
        });

        if (res.success) {
          setFeedback(res.message || `Game completed! Score: ${finalScore}`);
          if (res.highScore !== undefined) {
            setHighScores((prev) => ({
              ...prev,
              [activeGame]: Math.max(prev[activeGame], res.highScore!),
            }));
          }
        } else {
          setFeedback(res.error || "Failed to record result.");
        }
      } catch {
        setFeedback("Network error recording score.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // -------------------------------------------------------------
  // 1. Memory Matrix Game Logic
  // -------------------------------------------------------------
  const startMemoryMatrixRound = (currentLvl: number) => {
    const tileCount = Math.min(8, 3 + currentLvl);
    const pattern: number[] = [];
    while (pattern.length < tileCount) {
      const idx = Math.floor(Math.random() * 16);
      if (!pattern.includes(idx)) pattern.push(idx);
    }
    setMatrixPattern(pattern);
    setMatrixSelected([]);
    setMatrixRevealed(true);

    setTimeout(() => {
      setMatrixRevealed(false);
    }, 1400);
  };

  const handleTileClick = (idx: number) => {
    if (matrixRevealed || gameOver || matrixSelected.includes(idx)) return;

    if (matrixPattern.includes(idx)) {
      const newSelected = [...matrixSelected, idx];
      setMatrixSelected(newSelected);

      if (newSelected.length === matrixPattern.length) {
        // Round cleared
        const nextLevel = level + 1;
        const newScore = score + level * 100;
        setScore(newScore);
        setLevel(nextLevel);
        setTimeout(() => {
          startMemoryMatrixRound(nextLevel);
        }, 500);
      }
    } else {
      // Made a mistake -> game over
      handleGameEnd(score, level);
    }
  };

  // -------------------------------------------------------------
  // 2. Stroop Test Logic
  // -------------------------------------------------------------
  const generateStroopQuestion = () => {
    const textIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    // Ensure ink color is different from word text
    while (colorIdx === textIdx) {
      colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    }

    setStroopWord({
      text: STROOP_COLORS[textIdx].name,
      colorHex: STROOP_COLORS[colorIdx].hex,
      colorName: STROOP_COLORS[colorIdx].name,
    });
  };

  const handleStroopChoice = (chosenColorName: string) => {
    if (gameOver) return;

    if (chosenColorName === stroopWord.colorName) {
      setScore((s) => s + 50);
      setLevel((l) => l + 1);
    } else {
      setScore((s) => Math.max(0, s - 25));
    }
    generateStroopQuestion();
  };

  // -------------------------------------------------------------
  // 3. Speed Math Logic
  // -------------------------------------------------------------
  const generateMathQuestion = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 20) + 5;
    let b = Math.floor(Math.random() * 20) + 2;
    let answer = a + b;

    if (op === "-") {
      a = Math.max(a, b) + 5;
      answer = a - b;
    } else if (op === "×") {
      a = Math.floor(Math.random() * 11) + 2;
      b = Math.floor(Math.random() * 11) + 2;
      answer = a * b;
    }

    const options = [answer];
    while (options.length < 4) {
      const delta = (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      const fake = Math.max(1, answer + delta);
      if (!options.includes(fake)) options.push(fake);
    }
    options.sort(() => Math.random() - 0.5);

    setMathQuestion({
      text: `${a} ${op} ${b}`,
      options,
      answer,
    });
  };

  const handleMathChoice = (chosen: number) => {
    if (gameOver) return;

    if (chosen === mathQuestion.answer) {
      setScore((s) => s + 40);
      setLevel((l) => l + 1);
    } else {
      setScore((s) => Math.max(0, s - 20));
    }
    generateMathQuestion();
  };

  // Start game launcher
  const startGame = (type: "memory_matrix" | "stroop_test" | "speed_math") => {
    setActiveGame(type);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setFeedback(null);

    if (type === "memory_matrix") {
      setTimeLeft(0);
      startMemoryMatrixRound(1);
    } else if (type === "stroop_test") {
      setTimeLeft(45);
      generateStroopQuestion();
    } else if (type === "speed_math") {
      setTimeLeft(45);
      generateMathQuestion();
    }
  };

  const closeGameModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveGame(null);
    setGameOver(false);
  };

  const gamesCatalog = [
    {
      id: "memory_matrix" as const,
      title: "Memory Matrix",
      category: "Spatial Memory",
      difficulty: "Adaptive Grid",
      time: "Until mistake",
      highScore: `${highScores.memory_matrix} pts`,
      xpReward: 40,
      icon: Grid,
      description: "Remember the flashing tile pattern on a dynamic grid. Replicate the positions accurately as the matrix expands.",
      badge: "Memory",
      badgeVariant: "brand" as const,
    },
    {
      id: "stroop_test" as const,
      title: "Stroop Attention Challenge",
      category: "Executive Focus",
      difficulty: "Fast Paced",
      time: "45 sec",
      highScore: `${highScores.stroop_test} pts`,
      xpReward: 40,
      icon: Palette,
      description: "Overcome cognitive interference. Identify the ink font color of the word while ignoring the word text itself.",
      badge: "Inhibition",
      badgeVariant: "amber" as const,
    },
    {
      id: "speed_math" as const,
      title: "Speed Math Agility",
      category: "Numerical Quickness",
      difficulty: "Speed Drill",
      time: "45 sec",
      highScore: `${highScores.speed_math} pts`,
      xpReward: 35,
      icon: Calculator,
      description: "Solve rapid arithmetic equations under a ticking clock to enhance mental calculation speed and working memory.",
      badge: "Speed",
      badgeVariant: "cyan" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Module F"
        title="Cognitive Agility & Brain Games"
        description="Complement physical exercise with fast tactical mini-games designed to exercise working memory, processing speed, and executive focus."
        action={
          <Link href="/chess">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-amber-400" /> Play Chess Arena
            </Button>
          </Link>
        }
      />

      {/* Games Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gamesCatalog.map((game) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={game.badgeVariant}>{game.badge}</Badge>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {game.category}
                  </div>
                  <CardTitle className="text-lg mt-0.5">{game.title}</CardTitle>
                  <CardDescription className="text-xs mt-1 leading-relaxed">
                    {game.description}
                  </CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-800/80 py-2.5">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Personal High</span>
                    <span className="font-bold text-white">{game.highScore}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Duration</span>
                    <span className="font-bold text-slate-300">{game.time}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Badge variant="amber">+{game.xpReward} XP</Badge>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-1.5 text-slate-950 font-bold bg-brand-400 hover:bg-brand-300"
                  onClick={() => startGame(game.id)}
                >
                  <Play className="h-3.5 w-3.5 fill-slate-950" /> Play Game
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interactive Game Modal */}
      {activeGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  Brain Gym
                </span>
                <h3 className="font-extrabold text-white text-lg">
                  {activeGame === "memory_matrix"
                    ? "Memory Matrix"
                    : activeGame === "stroop_test"
                    ? "Stroop Attention Challenge"
                    : "Speed Math Agility"}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {activeGame !== "memory_matrix" && (
                  <Badge variant="amber" className="text-xs flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {timeLeft}s
                  </Badge>
                )}
                <button
                  onClick={closeGameModal}
                  className="text-slate-400 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Score & Level Bar */}
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-slate-400">
                Score: <strong className="text-white text-sm">{score}</strong>
              </span>
              <span className="text-slate-400">
                Level: <strong className="text-brand-400 text-sm">{level}</strong>
              </span>
              <span className="text-slate-400">
                High: <strong className="text-amber-400 text-sm">{highScores[activeGame]}</strong>
              </span>
            </div>

            {/* Active Game Canvas */}
            {!gameOver ? (
              <div className="py-2">
                {/* 1. Memory Matrix Canvas */}
                {activeGame === "memory_matrix" && (
                  <div className="space-y-4">
                    <p className="text-center text-xs text-slate-400">
                      {matrixRevealed
                        ? "Memorize the glowing tiles..."
                        : "Tap the tiles that were lit!"}
                    </p>
                    <div className="grid grid-cols-4 gap-3 max-w-[320px] mx-auto aspect-square">
                      {Array.from({ length: 16 }).map((_, idx) => {
                        const isPattern = matrixPattern.includes(idx);
                        const isSelected = matrixSelected.includes(idx);
                        const showLight = (matrixRevealed && isPattern) || isSelected;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleTileClick(idx)}
                            disabled={matrixRevealed}
                            className={`rounded-xl border transition-all duration-150 cursor-pointer ${
                              showLight
                                ? "bg-brand-500 border-brand-400 shadow-lg shadow-brand-500/40"
                                : "bg-slate-800 border-slate-700 hover:bg-slate-750"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Stroop Test Canvas */}
                {activeGame === "stroop_test" && (
                  <div className="space-y-6 text-center">
                    <p className="text-xs text-slate-400">
                      Select the **INK COLOR** of the word below (ignore the word text!):
                    </p>

                    <div
                      className="text-5xl font-black py-8 tracking-wider drop-shadow-md select-none"
                      style={{ color: stroopWord.colorHex }}
                    >
                      {stroopWord.text}
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
                      {STROOP_COLORS.map((c) => (
                        <Button
                          key={c.name}
                          variant="secondary"
                          onClick={() => handleStroopChoice(c.name)}
                          className="font-bold text-xs py-3"
                          style={{ borderColor: c.hex }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: c.hex }} />
                          {c.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Speed Math Canvas */}
                {activeGame === "speed_math" && (
                  <div className="space-y-6 text-center">
                    <p className="text-xs text-slate-400">
                      Calculate and choose the correct answer quickly:
                    </p>

                    <div className="text-4xl font-extrabold text-white py-6 font-mono tracking-widest">
                      {mathQuestion.text} = ?
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto">
                      {mathQuestion.options.map((opt, i) => (
                        <Button
                          key={i}
                          variant="secondary"
                          onClick={() => handleMathChoice(opt)}
                          className="text-base font-bold py-3 font-mono hover:border-brand-400"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Game Over / Results Screen */
              <div className="text-center space-y-5 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Trophy className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">Drill Completed!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Final Score: <strong className="text-white text-base">{score}</strong> • Level: {level}
                  </p>
                </div>

                {feedback && (
                  <p className="text-xs text-brand-300 font-medium p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    {feedback}
                  </p>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-1.5"
                    onClick={() => startGame(activeGame!)}
                  >
                    <RotateCcw className="h-4 w-4" /> Play Again
                  </Button>
                  <Button variant="secondary" size="sm" onClick={closeGameModal}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
