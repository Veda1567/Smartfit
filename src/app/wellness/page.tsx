"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Activity,
  Moon,
  Sun,
  ShieldAlert,
  Play,
  Clock,
  Heart,
  Brain,
  Volume2,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MentalWellnessPage() {
  const [breathingPhase, setBreathingPhase] = useState("Inhale (4s)");

  const wellnessActivities = [
    {
      title: "Box Breathing Focus",
      category: "Breath Regulation",
      duration: "4 min",
      difficulty: "All Levels",
      description: "Equal 4-count inhale, hold, exhale, and hold to swiftly balance the sympathetic nervous system.",
      badge: "Fast Relief",
      badgeVariant: "brand" as const,
    },
    {
      title: "4-7-8 Sleep Inducer",
      category: "Deep Relaxation",
      duration: "6 min",
      difficulty: "Evening",
      description: "Dr. Weil's renowned relaxation technique designed to quiet mental chatter before rest.",
      badge: "Evening",
      badgeVariant: "cyan" as const,
    },
    {
      title: "Sensory Grounding 5-4-3-2-1",
      category: "Mindfulness",
      duration: "5 min",
      difficulty: "All Levels",
      description: "Engage all five senses to ground your awareness and alleviate acute stress or overwhelm.",
      badge: "Clarity",
      badgeVariant: "amber" as const,
    },
    {
      title: "Desk Reset & Neck Release",
      category: "Physical Relaxation",
      duration: "7 min",
      difficulty: "Beginner",
      description: "Gentle isometric neck stretches and diaphragmatic sighs to undo ergonomic tension.",
      badge: "Workplace",
      badgeVariant: "slate" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Module C"
        title="Mental Wellness & Mindfulness"
        description="Strengthen mental clarity, down-regulate physical stress, and cultivate daily focus through evidence-based relaxation and breathwork."
        action={
          <div className="flex gap-2">
            <Link href="/meditation">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-cyan-400" /> Meditation Timers
              </Button>
            </Link>
            <Link href="/mudras">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-amber-400" /> Yogic Mudras
              </Button>
            </Link>
          </div>
        }
      />

      {/* Breathing Visualizer Shell Card */}
      <Card id="breathing" className="border-teal-500/30 bg-gradient-to-b from-teal-500/10 via-slate-900 to-slate-950 p-8 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-2">
          <Badge variant="brand">Interactive Visualizer</Badge>
          <h3 className="text-2xl font-bold text-white">Box Breathing Visualizer</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Follow the expanding circle. Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.
          </p>
        </div>

        {/* Visual Breathing Disc */}
        <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border-4 border-teal-500/40 bg-teal-500/10 shadow-2xl shadow-teal-500/20">
          <div className="h-32 w-32 rounded-full border-2 border-brand-400 border-dashed animate-pulse flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-teal-300">Phase</span>
            <span className="text-base font-bold text-white">{breathingPhase}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="lg" className="text-slate-950 font-bold px-6">
            Begin 3-Minute Session
          </Button>
          <Button variant="secondary" size="lg">
            Switch to 4-7-8
          </Button>
        </div>
      </Card>

      {/* Curated Wellness Activities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Mindfulness & Calming Activities</h3>
          <span className="text-xs text-slate-400">4 Available Practices</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wellnessActivities.map((act, idx) => (
            <Card
              key={idx}
              className="flex flex-col justify-between border-slate-800 bg-slate-900/80 p-6 hover:border-slate-700 transition-all duration-200"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {act.category}
                  </span>
                  <Badge variant={act.badgeVariant}>{act.badge}</Badge>
                </div>
                <CardTitle className="text-base">{act.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {act.description}
                </CardDescription>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>{act.duration}</span>
                </div>
                <Button size="sm" variant="secondary" className="text-xs">
                  Start Session
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
