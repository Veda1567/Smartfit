"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Dumbbell,
  Brain,
  Sparkles,
  Trophy,
  Flame,
  Droplets,
  HeartPulse,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Zap,
  Target,
  Play,
  Layers,
  ChevronRight,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { AchievementCard } from "@/components/ui/achievement-card";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-2/3 left-10 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />

      {/* =========================================================================
          SECTION 2: HERO SECTION
         ========================================================================= */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-400">
            <Zap className="h-3.5 w-3.5 fill-brand-400" />
            <span>The Complete Mind & Body Fitness Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
            Build Physical Power.{" "}
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Sharpen Cognitive Agility.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            SmartFit unites personal workout training, mindful meditation, traditional yogic mudras, and interactive chess tactics into one unified gamified ecosystem.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/trainer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full flex items-center justify-center gap-2 text-slate-950 font-bold">
                Start Personal Trainer <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/chess" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full flex items-center justify-center gap-2">
                <Brain className="h-4 w-4 text-amber-400" />
                Play Chess vs AI
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="text-xl font-bold text-white">6 In 1</div>
              <div className="text-xs text-slate-400">Holistic Domains</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="text-xl font-bold text-brand-400">100% Free</div>
              <div className="text-xs text-slate-400">Open Access</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="text-xl font-bold text-amber-400">Stockfish AI</div>
              <div className="text-xs text-slate-400">5 Difficulty Tiers</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="text-xl font-bold text-cyan-400">Cross-XP</div>
              <div className="text-xs text-slate-400">Unified Progression</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PERSONAL FITNESS TRAINER PREVIEW
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="brand" className="mb-2">Module A</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Personal Fitness Trainer & Biometrics
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Calculate your BMI screening index, estimate daily metabolic caloric needs, and receive tailored exercise regimens aligned with your personal goals.
            </p>
          </div>
          <Link href="/trainer">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              Open Trainer Hub <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: BMI Screening */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="brand">Screening Metric</Badge>
                <HeartPulse className="h-5 w-5 text-brand-400" />
              </div>
              <CardTitle>BMI & Body Composition</CardTitle>
              <CardDescription>General screening indicator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">Sample Value:</span>
                <span className="text-2xl font-bold text-brand-400">22.4</span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white">Status:</span> Normal / Healthy Weight range. (General fitness guide, non-medical).
              </div>
              <Progress value={50} variant="brand" />
            </CardContent>
          </Card>

          {/* Card 2: Caloric & Water Goals */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="cyan">Daily Estimations</Badge>
                <Droplets className="h-5 w-5 text-cyan-400" />
              </div>
              <CardTitle>Metabolism & Hydration</CardTitle>
              <CardDescription>Based on Mifflin-St Jeor equation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Est. Daily Burn:</span>
                <span className="font-bold text-white">~2,150 kcal</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Target Water:</span>
                <span className="font-bold text-cyan-400">2,500 ml / day</span>
              </div>
              <p className="text-slate-400 pt-1">
                Flexible approximations tailored to activity levels and wellness goals.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Adaptive Workouts */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader>
              <div className="flex items-center justify-between mb-1">
                <Badge variant="amber">Regimens</Badge>
                <Dumbbell className="h-5 w-5 text-amber-400" />
              </div>
              <CardTitle>Tailored Exercise Splits</CardTitle>
              <CardDescription>Strength, cardio, and mobility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="rounded-lg bg-slate-800/70 p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Full Body Mobility</div>
                  <div className="text-slate-400 text-[11px]">20 min • Beginner</div>
                </div>
                <Badge variant="brand">Active</Badge>
              </div>
              <div className="rounded-lg bg-slate-800/70 p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Core & HIIT Burst</div>
                  <div className="text-slate-400 text-[11px]">15 min • Intermediate</div>
                </div>
                <Badge variant="slate">Queued</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 & 5 & 6: MENTAL WELLNESS, MEDITATION & MUDRAS
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="cyan" className="mb-2">Module C & D</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Mental Wellness, Meditation & Mudras
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              True fitness includes psychological balance. Explore box breathing visualizers, ambient soundscapes, and ancient yogic mudra postures for cognitive focus.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/wellness">
              <Button variant="outline" size="sm">Wellness Hub</Button>
            </Link>
            <Link href="/mudras">
              <Button variant="outline" size="sm">Mudras Guide</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-teal-500/30 bg-teal-500/5">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="brand">Breath Regulation</Badge>
                <Activity className="h-5 w-5 text-teal-400" />
              </div>
              <CardTitle>Animated Box Breathing</CardTitle>
              <CardDescription>4s Inhale • 4s Hold • 4s Exhale • 4s Hold</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-28 items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="h-16 w-16 rounded-full border-2 border-brand-400 border-dashed animate-spin flex items-center justify-center text-[10px] text-brand-400 font-bold">
                  Breathe
                </div>
              </div>
              <Link href="/wellness#breathing">
                <Button variant="secondary" size="sm" className="w-full">
                  Start 2-Min Session
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/30 bg-cyan-500/5">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="cyan">Mindfulness</Badge>
                <Layers className="h-5 w-5 text-cyan-400" />
              </div>
              <CardTitle>Guided Meditation Timers</CardTitle>
              <CardDescription>Stress release & deep restful sleep</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span>Morning Clarity Session</span>
                <span className="text-slate-400">10 min</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span>Body Scan for Rest</span>
                <span className="text-slate-400">15 min</span>
              </div>
              <Link href="/meditation" className="block pt-1">
                <Button variant="secondary" size="sm" className="w-full">
                  Explore Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="amber">Traditional Focus</Badge>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <CardTitle>Illustrated Yogic Mudras</CardTitle>
              <CardDescription>Gyan, Prana, Vayu & Shunya Mudras</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Learn hand anatomical placements to cultivate calm, focus, and mindful posture during study or reflection.
              </p>
              <div className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                Traditional mindfulness practice • Non-medical
              </div>
              <Link href="/mudras" className="block pt-1">
                <Button variant="secondary" size="sm" className="w-full">
                  View Mudras Gallery
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CHESS & COGNITIVE FITNESS
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="amber" className="mb-2">Module E & F</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Chess & Cognitive Fitness Arena
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Challenge your tactical vision. Play on an interactive board powered by Stockfish AI across 5 difficulty tiers, solve tactical checkmates, and test executive focus.
            </p>
          </div>
          <Link href="/chess">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5 font-semibold">
              Enter Chess Arena <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Chessboard Mockup */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="font-bold text-white">Stockfish AI (Level 2)</span>
              </div>
              <Badge variant="amber">Tactics In Progress</Badge>
            </div>

            {/* 8x8 Board Shell Preview */}
            <div className="my-4 aspect-square max-w-[360px] mx-auto grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isDark = (row + col) % 2 === 1;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-xs font-bold ${
                      isDark ? "bg-slate-800 text-slate-400" : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {i === 36 && <span className="text-amber-400 font-extrabold text-sm">♞</span>}
                    {i === 28 && <span className="text-brand-400 font-extrabold text-sm">♟</span>}
                    {i === 60 && <span className="text-white font-extrabold text-sm">♚</span>}
                    {i === 4 && <span className="text-slate-400 font-extrabold text-sm">♚</span>}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>White: SmartFit Player (1200 ELO)</span>
              <span>Black: Stockfish AI (1100 ELO)</span>
            </div>
          </div>

          {/* Stats & Mini-Games */}
          <div className="lg:col-span-5 space-y-4">
            <StatCard
              title="Current Chess Rating"
              value="1,240 ELO"
              subtitle="Top 35% of SmartFit Club players"
              icon={<Brain className="h-5 w-5 text-amber-400" />}
              badgeText="Tactician"
              badgeVariant="amber"
            />
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">Daily Checkmate Drill</span>
                <Badge variant="brand">+40 XP</Badge>
              </div>
              <p className="text-xs text-slate-400">
                White to move and deliver mate in 2 moves.
              </p>
              <Link href="/chess">
                <Button variant="secondary" size="sm" className="w-full">
                  Solve Today's Puzzle
                </Button>
              </Link>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Stroop Attention Challenge</div>
                <div className="text-[11px] text-slate-400">Test color-word executive focus</div>
              </div>
              <Link href="/cognitive">
                <Button variant="outline" size="sm">Play</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8 & 9: GAMIFICATION, QUESTS & ACHIEVEMENTS
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="amber" className="mb-2">Module H</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Unified Gamification & Daily Quests
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Every workout logged, glass of water tracked, meditation concluded, and chess game won feeds into your single SmartFit XP level and streak.
            </p>
          </div>
          <Link href="/challenges">
            <Button variant="outline" size="sm">View All Quests</Button>
          </Link>
        </div>

        {/* Gamification Progression Loop Visualizer */}
        <div className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>Level 5: Wellness Adept</span>
            <span className="text-brand-400 font-bold">1,118 / 1,500 XP</span>
          </div>
          <Progress value={74} variant="brand" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-white">7-Day Consistency Streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-white">Rank #14 on Weekly Board</span>
            </div>
          </div>
        </div>

        {/* Sample Daily Quests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChallengeCard
            title="Mindful Hydration"
            category="Daily Hydration"
            description="Log 8 glasses (2,000ml) of water today."
            xpReward={30}
            currentProgress={5}
            targetProgress={8}
            unit="glasses"
            timeLeft="8h remaining"
            icon={<Droplets className="h-4 w-4 text-cyan-400" />}
          />
          <ChallengeCard
            title="Core Power Routine"
            category="Fitness Quest"
            description="Complete any 15+ min bodyweight workout."
            xpReward={100}
            currentProgress={1}
            targetProgress={1}
            unit="session"
            timeLeft="Completed"
            icon={<Dumbbell className="h-4 w-4 text-brand-400" />}
          />
          <ChallengeCard
            title="Tactical Vision"
            category="Chess Quest"
            description="Win 1 match against Stockfish AI (Medium)."
            xpReward={60}
            currentProgress={0}
            targetProgress={1}
            unit="win"
            timeLeft="8h remaining"
            icon={<Brain className="h-4 w-4 text-amber-400" />}
          />
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: SMARTFIT AI WELLNESS COACH
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-950 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
              <Bot className="h-3.5 w-3.5" />
              <span>SmartFit AI Wellness Coach (Phase 17 Integration)</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Intelligent, Context-Aware Personal Guidance
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Have questions on adapting your workout, swapping meals, or reviewing chess opening tactics? Our AI Coach provides non-medical lifestyle insights with strict health safety guardrails.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  // Triggers the global floating drawer
                  const trigger = document.querySelector('button[aria-label="Open SmartFit AI Wellness Coach"]') as HTMLButtonElement;
                  trigger?.click();
                }}
                className="flex items-center gap-2 text-slate-950 font-bold"
              >
                <Bot className="h-4 w-4" />
                Launch AI Coach Preview
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 12: FINAL CALL TO ACTION
         ========================================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-800/60 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Start Your Complete Wellness Journey
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Train your muscles. Calm your nervous system. Challenge your brain. SmartFit brings it all together.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/profile" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-slate-950 font-bold">
                View Member Dashboard
              </Button>
            </Link>
            <Link href="/leaderboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Explore Community Ranks
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
