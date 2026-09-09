"use client";

import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Flame,
  Brain,
  Dumbbell,
  Crown,
  Sparkles,
  User,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("overall");

  const tabs = [
    { id: "overall", label: "Overall XP" },
    { id: "weekly", label: "Weekly Sprint" },
    { id: "chess", label: "Chess ELO" },
    { id: "fitness", label: "Fitness Points" },
  ];

  const topThree = [
    { rank: 2, username: "Elena_Fit", xp: "4,820 XP", level: "Lvl 14", streak: "18 Days", color: "from-slate-400 to-slate-600" },
    { rank: 1, username: "Marcus_V", xp: "5,450 XP", level: "Lvl 16", streak: "24 Days", color: "from-amber-400 to-amber-600" },
    { rank: 3, username: "Devon_Chess", xp: "4,210 XP", level: "Lvl 12", streak: "14 Days", color: "from-amber-600 to-amber-800" },
  ];

  const rankings = [
    { rank: 4, username: "Sarah_Mindful", score: "3,890 XP", level: "Lvl 11", streak: "12 Days", badge: "Zen Master" },
    { rank: 5, username: "Alex_Runner", score: "3,420 XP", level: "Lvl 10", streak: "9 Days", badge: "Cardio King" },
    { rank: 6, username: "Rohan_Tactics", score: "3,150 XP", level: "Lvl 9", streak: "8 Days", badge: "Grandmaster" },
    { rank: 7, username: "Maya_Yoga", score: "2,980 XP", level: "Lvl 8", streak: "7 Days", badge: "Yogi" },
    { rank: 8, username: "Chris_Iron", score: "2,740 XP", level: "Lvl 8", streak: "6 Days", badge: "Iron Core" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Community & Competition"
        title="SmartFit Leaderboard Rankings"
        description="Celebrate consistent dedication. Compete friendly with community members across workouts, chess matches, meditation streaks, and tactical puzzles."
      />

      <div className="flex justify-center sm:justify-start">
        <Tabs items={tabs} defaultTab="overall" onChange={setActiveTab} />
      </div>

      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
        {/* Rank 2 */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 text-center space-y-3 order-2 md:order-1">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-extrabold text-xl shadow-lg">
            2
          </div>
          <div className="font-bold text-white text-base">{topThree[0].username}</div>
          <div className="text-xl font-extrabold text-slate-300">{topThree[0].xp}</div>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="slate">{topThree[0].level}</Badge>
            <Badge variant="amber">{topThree[0].streak}</Badge>
          </div>
        </Card>

        {/* Rank 1 (Tallest Center Card) */}
        <Card className="border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 p-8 text-center space-y-4 order-1 md:order-2 md:-translate-y-4 shadow-2xl shadow-amber-500/10">
          <Crown className="h-8 w-8 text-amber-400 mx-auto" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 font-extrabold text-2xl shadow-xl">
            1
          </div>
          <div>
            <div className="font-extrabold text-white text-lg">{topThree[1].username}</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{topThree[1].xp}</div>
          </div>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="brand">{topThree[1].level}</Badge>
            <Badge variant="amber">{topThree[1].streak}</Badge>
          </div>
        </Card>

        {/* Rank 3 */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 text-center space-y-3 order-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-amber-600 font-extrabold text-xl shadow-lg">
            3
          </div>
          <div className="font-bold text-white text-base">{topThree[2].username}</div>
          <div className="text-xl font-extrabold text-slate-400">{topThree[2].xp}</div>
          <div className="flex justify-center gap-2 text-xs">
            <Badge variant="slate">{topThree[2].level}</Badge>
            <Badge variant="amber">{topThree[2].streak}</Badge>
          </div>
        </Card>
      </div>

      {/* Rankings Table (Ranks 4-8) */}
      <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Athlete / Member</th>
                <th className="px-6 py-3.5">Level</th>
                <th className="px-6 py-3.5">Streak</th>
                <th className="px-6 py-3.5 text-right">Points / XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rankings.map((user) => (
                <tr key={user.rank} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400">#{user.rank}</td>
                  <td className="px-6 py-4 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs">
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{user.username}</div>
                      <div className="text-[11px] text-slate-500">{user.badge}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono">{user.level}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-xs">
                      <Flame className="h-3 w-3 fill-amber-400" />
                      {user.streak}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-extrabold text-brand-400">
                    {user.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
