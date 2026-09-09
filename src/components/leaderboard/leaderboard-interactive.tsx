"use client";

import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Flame,
  Crown,
  Sparkles,
  User,
  ShieldCheck,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeaderboardAction, type LeaderboardEntry } from "@/app/actions/gamification";

interface LeaderboardInteractiveProps {
  initialTopThree: LeaderboardEntry[];
  initialRankings: LeaderboardEntry[];
  initialCurrentUserRank: LeaderboardEntry | null;
  currentUsername?: string;
}

export function LeaderboardInteractive({
  initialTopThree,
  initialRankings,
  initialCurrentUserRank,
  currentUsername,
}: LeaderboardInteractiveProps) {
  const [activeTab, setActiveTab] = useState("overall");
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>(initialTopThree);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>(initialRankings);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(
    initialCurrentUserRank
  );
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "overall", label: "Overall XP" },
    { id: "weekly", label: "Weekly Sprint" },
    { id: "chess", label: "Chess ELO" },
    { id: "fitness", label: "Fitness Volume" },
  ];

  const handleTabChange = async (tabId: string) => {
    setActiveTab(tabId);
    setLoading(true);

    try {
      const res = await getLeaderboardAction(tabId);
      if (res.success) {
        setTopThree(res.topThree);
        setRankings(res.rankings);
        setCurrentUserRank(res.currentUserRank);
      }
    } catch (err) {
      console.error("Failed to load tab rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Community & Competition"
        title="SmartFit Leaderboard Rankings"
        description="Celebrate consistent dedication. Compete friendly with community members across workouts, chess matches, meditation streaks, and tactical puzzles."
      />

      {/* Tabs */}
      <div className="flex justify-center sm:justify-start">
        <Tabs items={tabs} defaultTab="overall" onChange={handleTabChange} />
      </div>

      {/* Current User Standing Banner */}
      {currentUserRank && (
        <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-slate-900 to-slate-950 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 font-extrabold text-base border border-brand-500/30">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Your Current Standing:</span>
                <span className="text-brand-400 font-extrabold text-sm">{currentUserRank.username}</span>
                <Badge variant="brand" className="text-[10px]">{currentUserRank.level}</Badge>
              </div>
              <p className="text-xs text-slate-400">
                Score: <strong className="text-white">{currentUserRank.score}</strong> • Streak: <strong className="text-amber-400">{currentUserRank.streak}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-brand-400" />
            <span>Verified Server Rating</span>
          </div>
        </div>
      )}

      {/* Podium for Top 3 */}
      {topThree.length > 0 ? (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Rank 2 (Left) */}
          {topThree[1] ? (
            <Card
              className={`border-slate-800 bg-slate-900/80 p-6 text-center space-y-3 order-2 md:order-1 ${
                topThree[1].isCurrentUser ? "border-brand-500/50 bg-brand-500/10" : ""
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-extrabold text-xl shadow-lg">
                2
              </div>
              <div className="font-bold text-white text-base truncate">{topThree[1].username}</div>
              <div className="text-xl font-extrabold text-slate-300">{topThree[1].score}</div>
              <div className="flex justify-center gap-2 text-xs">
                <Badge variant="slate">{topThree[1].level}</Badge>
                <Badge variant="amber">{topThree[1].streak}</Badge>
              </div>
            </Card>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Rank 1 (Tallest Center Card) */}
          {topThree[0] && (
            <Card
              className={`border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 p-8 text-center space-y-4 order-1 md:order-2 md:-translate-y-4 shadow-2xl shadow-amber-500/10 ${
                topThree[0].isCurrentUser ? "border-amber-400 bg-amber-500/20" : ""
              }`}
            >
              <Crown className="h-8 w-8 text-amber-400 mx-auto" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 font-extrabold text-2xl shadow-xl">
                1
              </div>
              <div>
                <div className="font-extrabold text-white text-lg truncate">{topThree[0].username}</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{topThree[0].score}</div>
              </div>
              <div className="flex justify-center gap-2 text-xs">
                <Badge variant="brand">{topThree[0].level}</Badge>
                <Badge variant="amber">{topThree[0].streak}</Badge>
              </div>
            </Card>
          )}

          {/* Rank 3 (Right) */}
          {topThree[2] ? (
            <Card
              className={`border-slate-800 bg-slate-900/80 p-6 text-center space-y-3 order-3 ${
                topThree[2].isCurrentUser ? "border-brand-500/50 bg-brand-500/10" : ""
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-amber-600 font-extrabold text-xl shadow-lg">
                3
              </div>
              <div className="font-bold text-white text-base truncate">{topThree[2].username}</div>
              <div className="text-xl font-extrabold text-slate-400">{topThree[2].score}</div>
              <div className="flex justify-center gap-2 text-xs">
                <Badge variant="slate">{topThree[2].level}</Badge>
                <Badge variant="amber">{topThree[2].streak}</Badge>
              </div>
            </Card>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      ) : (
        <Card className="border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
          No rankings recorded yet for this category. Log your first workout or match to claim the crown!
        </Card>
      )}

      {/* Rankings Table (Ranks 4+) */}
      {rankings.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Athlete / Member</th>
                  <th className="px-6 py-3.5">Level</th>
                  <th className="px-6 py-3.5">Streak</th>
                  <th className="px-6 py-3.5 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankings.map((user) => (
                  <tr
                    key={user.rank}
                    className={`transition-colors ${
                      user.isCurrentUser
                        ? "bg-brand-500/10 font-bold"
                        : "hover:bg-slate-850/40"
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-400">#{user.rank}</td>
                    <td className="px-6 py-4 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs uppercase">
                        {user.username.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{user.username}</span>
                          {user.isCurrentUser && (
                            <Badge variant="brand" className="text-[9px] py-0 px-1.5">You</Badge>
                          )}
                        </div>
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
      )}
    </div>
  );
}
