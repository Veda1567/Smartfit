"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Dumbbell,
  Droplets,
  Brain,
  Sparkles,
  Layers,
  Flame,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { claimChallengeRewardAction, type ChallengeItem } from "@/app/actions/gamification";

interface ChallengesInteractiveProps {
  initialChallenges: ChallengeItem[];
  currentStreak: number;
}

export function ChallengesInteractive({
  initialChallenges,
  currentStreak,
}: ChallengesInteractiveProps) {
  const [challenges, setChallenges] = useState<ChallengeItem[]>(initialChallenges);
  const [filter, setFilter] = useState("all");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const tabs = [
    { id: "all", label: "All Challenges" },
    { id: "fitness", label: "Physical Fitness" },
    { id: "wellness", label: "Mindfulness & Zen" },
    { id: "chess", label: "Chess Arena" },
    { id: "cognitive", label: "Brain Agility" },
  ];

  const filteredChallenges =
    filter === "all"
      ? challenges
      : challenges.filter(
          (c) =>
            c.domain === filter ||
            (filter === "fitness" && (c.domain === "fitness" || c.domain === "hydration"))
        );

  const handleClaim = async (challengeId: string) => {
    setClaimingId(challengeId);
    setFeedback(null);

    try {
      const res = await claimChallengeRewardAction(challengeId);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Reward claimed!" });
        setChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, isCompleted: true, canClaim: false } : c))
        );
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to claim reward." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error claiming reward." });
    } finally {
      setClaimingId(null);
    }
  };

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case "fitness":
        return <Dumbbell className="h-4 w-4 text-brand-400" />;
      case "hydration":
        return <Droplets className="h-4 w-4 text-cyan-400" />;
      case "wellness":
        return <Layers className="h-4 w-4 text-teal-400" />;
      case "chess":
        return <Brain className="h-4 w-4 text-amber-400" />;
      case "cognitive":
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      default:
        return <Trophy className="h-4 w-4 text-brand-400" />;
    }
  };

  const getActionLink = (domain: string) => {
    switch (domain) {
      case "fitness":
        return "/fitness";
      case "hydration":
        return "/fitness";
      case "wellness":
        return "/wellness";
      case "chess":
        return "/chess";
      case "cognitive":
        return "/cognitive";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader
        category="Module D"
        title="Quests & Challenges Arena"
        description="Earn XP, maintain your daily consistency streaks, and level up your SmartFit profile by completing quests across physical and cognitive disciplines."
      />

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-brand-500/10 border-brand-500/40 text-brand-300"
              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs items={tabs} defaultTab="all" onChange={setFilter} />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span>
            {currentStreak > 0
              ? `${currentStreak}-Day Streak Active (+${Math.min(currentStreak * 5, 25)}% Bonus XP)`
              : "Start a streak today for bonus XP!"}
          </span>
        </div>
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge) => {
          const isComplete = challenge.isCompleted;
          const canClaim = challenge.canClaim;
          const pct = Math.min(
            100,
            Math.round((challenge.currentProgress / Math.max(1, challenge.targetProgress)) * 100)
          );

          return (
            <Card
              key={challenge.id}
              className={`flex flex-col justify-between border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all duration-200 ${
                isComplete
                  ? "border-brand-500/30 bg-brand-500/5"
                  : canClaim
                  ? "border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5"
                  : ""
              }`}
            >
              <CardHeader className="p-0 pb-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-brand-400 border border-slate-700/60">
                      {getDomainIcon(challenge.domain)}
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {challenge.category}
                      </span>
                      <CardTitle className="text-base font-bold text-white leading-snug">
                        {challenge.title}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge variant="amber" className="shrink-0 flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    <span>+{challenge.xpReward} XP</span>
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-400 line-clamp-2">
                  {challenge.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-3 border-t border-slate-800/80 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Goal Progress</span>
                    <span className="font-semibold text-slate-200">
                      {challenge.currentProgress} / {challenge.targetProgress} {challenge.unit}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    variant={isComplete ? "brand" : canClaim ? "amber" : "cyan"}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{challenge.timeLeft}</span>
                  </div>

                  {isComplete ? (
                    <Badge variant="brand" className="text-xs py-1 px-3 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </Badge>
                  ) : canClaim ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="ml-auto text-xs py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1"
                      onClick={() => handleClaim(challenge.id)}
                      disabled={claimingId === challenge.id}
                    >
                      <Zap className="h-3.5 w-3.5 fill-slate-950" />
                      {claimingId === challenge.id ? "Claiming..." : "Claim Reward"}
                    </Button>
                  ) : (
                    <Link href={getActionLink(challenge.domain)}>
                      <Button size="sm" variant="secondary" className="ml-auto text-xs py-1.5 px-3">
                        Start Quest
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
