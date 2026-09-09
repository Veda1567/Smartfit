"use client";

import React, { useState } from "react";
import {
  Brain,
  Trophy,
  Play,
  RotateCcw,
  Flag,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

export default function ChessPage() {
  const [difficulty, setDifficulty] = useState("medium");

  const difficulties = [
    { id: "beginner", label: "Beginner (~800 ELO)", depth: "Depth 1" },
    { id: "easy", label: "Easy (~1100 ELO)", depth: "Depth 3" },
    { id: "medium", label: "Medium (~1400 ELO)", depth: "Depth 6" },
    { id: "hard", label: "Hard (~1750 ELO)", depth: "Depth 10" },
    { id: "advanced", label: "Advanced (~2100+ ELO)", depth: "Depth 14" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Module E"
        title="Chess & Cognitive Fitness Arena"
        description="Strengthen executive concentration, tactical planning, and mental discipline. Play against Stockfish AI across 5 difficulty tiers and conquer tactical puzzles."
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chess ELO Rating"
          value="1,240"
          subtitle="Top 35% SmartFit players"
          icon={<Brain className="h-5 w-5 text-amber-400" />}
          badgeText="Tactician"
          badgeVariant="amber"
        />
        <StatCard
          title="Games Record"
          value="24 / 14 / 6"
          subtitle="Wins • Losses • Draws"
          icon={<Trophy className="h-5 w-5 text-brand-400" />}
          badgeText="63% Winrate"
          badgeVariant="brand"
        />
        <StatCard
          title="Puzzles Solved"
          value="42"
          subtitle="+1,680 XP total earned"
          icon={<Sparkles className="h-5 w-5 text-cyan-400" />}
          badgeText="Tactics"
          badgeVariant="cyan"
        />
        <StatCard
          title="Cognitive XP"
          value="480 XP"
          subtitle="Earned this week in chess"
          icon={<Brain className="h-5 w-5 text-purple-400" />}
          badgeText="+Level Up"
          badgeVariant="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chessboard Shell */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-slate-800 bg-slate-900/90 p-6">
            {/* Top Match Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-white font-bold">
                  ♚
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stockfish Engine</h3>
                  <p className="text-xs text-slate-400">Level: {difficulty.toUpperCase()} AI</p>
                </div>
              </div>
              <Badge variant="amber">Turn: White to Move</Badge>
            </div>

            {/* 8x8 Chessboard Visual Shell */}
            <div className="my-6 aspect-square max-w-[440px] mx-auto grid grid-cols-8 grid-rows-8 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl shadow-black/50">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isDark = (row + col) % 2 === 1;

                // Simple sample piece positions
                let piece = "";
                if (i === 0 || i === 7) piece = "♜";
                if (i === 1 || i === 6) piece = "♞";
                if (i === 2 || i === 5) piece = "♝";
                if (i === 3) piece = "♛";
                if (i === 4) piece = "♚";
                if (row === 1) piece = "♟";

                if (i === 56 || i === 63) piece = "♖";
                if (i === 57 || i === 62) piece = "♘";
                if (i === 58 || i === 61) piece = "♗";
                if (i === 59) piece = "♕";
                if (i === 60) piece = "♔";
                if (row === 6) piece = "♙";

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-lg sm:text-2xl font-bold select-none cursor-pointer transition-colors ${
                      isDark
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-750"
                        : "bg-slate-700 text-amber-100 hover:bg-slate-650"
                    }`}
                  >
                    {piece}
                  </div>
                );
              })}
            </div>

            {/* Bottom Player Status & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 font-bold">
                  ♔
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">SmartFit Player</h4>
                  <p className="text-xs text-slate-400">Rating: 1,240 ELO</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" /> Restart
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1.5 text-rose-400 border-rose-500/30">
                  <Flag className="h-3.5 w-3.5" /> Resign
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Difficulty Selector & Puzzles */}
        <div className="lg:col-span-4 space-y-6">
          {/* Difficulty Tiers Card */}
          <Card className="border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <CardTitle className="text-sm">Select AI Difficulty</CardTitle>
            <div className="space-y-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficulty(diff.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    difficulty === diff.id
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400 font-bold"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{diff.label}</span>
                  <span className="text-[10px] text-slate-500">{diff.depth}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Daily Puzzle Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Daily Tactical Drill
              </span>
              <Badge variant="amber">+40 XP</Badge>
            </div>
            <CardTitle className="text-sm">Back-Rank Checkmate #14</CardTitle>
            <CardDescription className="text-xs">
              White to move. Capitalize on Black's trapped King behind unmoved pawns.
            </CardDescription>
            <Button size="sm" variant="primary" className="w-full text-slate-950 font-bold">
              Solve Puzzle
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
