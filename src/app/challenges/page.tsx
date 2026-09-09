"use client";

import React, { useState } from "react";
import {
  Trophy,
  Dumbbell,
  Droplets,
  Brain,
  Sparkles,
  Layers,
  Flame,
  Clock,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import { ChallengeCard } from "@/components/ui/challenge-card";

export default function ChallengesPage() {
  const [filter, setFilter] = useState("all");

  const tabs = [
    { id: "all", label: "All Challenges" },
    { id: "physical", label: "Physical & Hydration" },
    { id: "mental", label: "Mindfulness & Yoga" },
    { id: "chess", label: "Chess & Brain" },
  ];

  const challenges = [
    {
      title: "Mindful Hydration Quota",
      category: "Hydration",
      domain: "physical",
      description: "Drink and log 8 glasses (2,000ml) of water today.",
      xpReward: 30,
      currentProgress: 6,
      targetProgress: 8,
      unit: "glasses",
      timeLeft: "6h left",
      icon: <Droplets className="h-4 w-4 text-cyan-400" />,
    },
    {
      title: "Core Power 20-Min Workout",
      category: "Fitness Routine",
      domain: "physical",
      description: "Complete a prescribed 20-minute bodyweight core routine.",
      xpReward: 100,
      currentProgress: 1,
      targetProgress: 1,
      unit: "routine",
      timeLeft: "Completed",
      icon: <Dumbbell className="h-4 w-4 text-brand-400" />,
    },
    {
      title: "Daily Morning Centering",
      category: "Meditation",
      domain: "mental",
      description: "Complete a 10-minute mindfulness breathing meditation session.",
      xpReward: 50,
      currentProgress: 0,
      targetProgress: 1,
      unit: "session",
      timeLeft: "14h left",
      icon: <Layers className="h-4 w-4 text-teal-400" />,
    },
    {
      title: "Tactical Chess Victory",
      category: "Chess Match",
      domain: "chess",
      description: "Win 1 chess game against Stockfish AI at Medium difficulty.",
      xpReward: 60,
      currentProgress: 0,
      targetProgress: 1,
      unit: "win",
      timeLeft: "10h left",
      icon: <Brain className="h-4 w-4 text-amber-400" />,
    },
    {
      title: "Solve 3 Tactical Puzzles",
      category: "Chess Tactics",
      domain: "chess",
      description: "Find the winning move sequence in 3 daily checkmate puzzles.",
      xpReward: 80,
      currentProgress: 2,
      targetProgress: 3,
      unit: "puzzles",
      timeLeft: "12h left",
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
    },
    {
      title: "7-Day Weekly Cross-Training",
      category: "Weekly Quest",
      domain: "physical",
      description: "Log at least 4 workouts and 4 meditation sessions this week.",
      xpReward: 250,
      currentProgress: 5,
      targetProgress: 8,
      unit: "activities",
      timeLeft: "3 days left",
      icon: <Trophy className="h-4 w-4 text-purple-400" />,
    },
  ];

  const filteredChallenges =
    filter === "all"
      ? challenges
      : challenges.filter((c) => c.domain === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader
        category="Module D"
        title="Quests & Challenges Arena"
        description="Earn XP, maintain your daily consistency streaks, and level up your SmartFit profile by completing quests across physical and cognitive disciplines."
      />

      <div className="flex items-center justify-between">
        <Tabs items={tabs} defaultTab="all" onChange={setFilter} />
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span>Active Streak Bonus: +20% XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge, idx) => (
          <ChallengeCard key={idx} {...challenge} />
        ))}
      </div>
    </div>
  );
}
