"use client";

import React, { useState } from "react";
import {
  Layers,
  Clock,
  Volume2,
  Play,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MeditationPage() {
  const [selectedSoundscape, setSelectedSoundscape] = useState("Gentle Rain");

  const sessions = [
    {
      title: "Mindfulness of Breath",
      category: "Foundation",
      duration: "10 min",
      xpReward: 50,
      description: "Anchor attention onto the natural rhythm of breathing to settle an active racing mind.",
      badge: "Beginner Friendly",
      badgeVariant: "brand" as const,
    },
    {
      title: "Body Scan for Stress Release",
      category: "Relaxation",
      duration: "15 min",
      xpReward: 50,
      description: "Progressively bring conscious awareness to each muscle group from head to toe, releasing stored tension.",
      badge: "Popular",
      badgeVariant: "cyan" as const,
    },
    {
      title: "Deep Sleep & Evening Unwind",
      category: "Sleep",
      duration: "20 min",
      xpReward: 60,
      description: "Slow delta wave soundscapes combined with gentle visualizations to prepare your physiology for deep restorative rest.",
      badge: "Evening",
      badgeVariant: "purple" as const,
    },
    {
      title: "Cognitive Focus & Centering",
      category: "Performance",
      duration: "5 min",
      xpReward: 30,
      description: "A rapid cognitive centering exercise designed to precede deep work, study, or intense chess play.",
      badge: "Quick",
      badgeVariant: "amber" as const,
    },
  ];

  const soundscapes = [
    "Gentle Rain",
    "Ocean Waves",
    "Tibetan Singing Bowls",
    "Forest Stream",
    "Pure Silence",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Mindfulness"
        title="Guided Meditation & Ambient Timers"
        description="Select a curated meditation session or configure your custom timer with soothing background acoustic soundscapes."
      />

      {/* Soundscape Selector Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold">Ambient Soundscape:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {soundscapes.map((sound) => (
            <button
              key={sound}
              onClick={() => setSelectedSoundscape(sound)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                selectedSoundscape === sound
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-bold"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {sound}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session, idx) => (
          <Card
            key={idx}
            className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {session.category}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="amber">+{session.xpReward} XP</Badge>
                  <Badge variant={session.badgeVariant}>{session.badge}</Badge>
                </div>
              </div>

              <CardTitle className="text-lg">{session.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {session.description}
              </CardDescription>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="font-semibold text-slate-200">{session.duration}</span>
              </div>
              <Button size="sm" variant="primary" className="flex items-center gap-1.5 text-slate-950 font-bold">
                <Play className="h-3.5 w-3.5 fill-slate-950" /> Start Session
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
