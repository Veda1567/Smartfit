"use client";

import React from "react";
import Link from "next/link";
import {
  Brain,
  Zap,
  Grid,
  Palette,
  Calculator,
  Trophy,
  Play,
  Clock,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CognitiveGamesPage() {
  const games = [
    {
      title: "Memory Matrix",
      category: "Spatial Memory",
      difficulty: "Dynamic",
      time: "2 mins",
      highScore: "Level 8",
      xpReward: 40,
      icon: Grid,
      description: "Remember the flashing tile pattern on a dynamic grid. Replicate the positions accurately as the matrix expands.",
      badge: "Memory",
      badgeVariant: "brand" as const,
    },
    {
      title: "Stroop Attention Challenge",
      category: "Executive Focus",
      difficulty: "Fast Paced",
      time: "60 sec",
      highScore: "940 pts",
      xpReward: 40,
      icon: Palette,
      description: "Overcome cognitive interference. Identify the ink font color of the word while ignoring the word text itself.",
      badge: "Inhibition",
      badgeVariant: "amber" as const,
    },
    {
      title: "Speed Math Agility",
      category: "Numerical Quickness",
      difficulty: "Speed Drill",
      time: "60 sec",
      highScore: "28 correct",
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
        {games.map((game, idx) => {
          const Icon = game.icon;
          return (
            <Card
              key={idx}
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
                    <span className="text-slate-500 text-[10px] block">High Score</span>
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
                <Button size="sm" variant="primary" className="flex items-center gap-1.5 text-slate-950 font-bold">
                  <Play className="h-3.5 w-3.5 fill-slate-950" /> Play Game
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
