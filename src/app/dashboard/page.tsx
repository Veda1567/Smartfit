import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Link from "next/link";

import {
  Activity,
  Brain,
  Dumbbell,
  Droplets,
  Flame,
  Sparkles,
  Trophy,
  Target,
  ChevronRight,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    include: {
      profile: true,
      gamification: true,
      waterPreference: true,
      waterLogs: true,
      workoutSessions: true,
      chessStats: true,
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const profile = user.profile;
  const gamification = user.gamification;
  const waterGoal = user.waterPreference?.dailyTargetMl ?? 2500;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayWater = user.waterLogs
    .filter((log) => new Date(log.loggedAt) >= today)
    .reduce((sum, log) => sum + log.amountMl, 0);

  const todayCalories = user.workoutSessions
    .filter((workout) => new Date(workout.completedAt) >= today)
    .reduce(
      (sum, workout) => sum + (workout.estimatedCaloriesBurned ?? 0),
      0
    );

  const waterPercentage = Math.min(
    Math.round((todayWater / waterGoal) * 100),
    100
  );

  const currentXP = gamification?.totalXP ?? 0;
  const currentLevel = gamification?.currentLevel ?? 1;
  const currentStreak = gamification?.currentStreak ?? 0;

  const nextLevelXP = currentLevel * 500;
  const xpPercentage = Math.min(
    Math.round((currentXP / nextLevelXP) * 100),
    100
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

      {/* Welcome */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <Badge variant="brand" className="mb-3">
              SmartFit Dashboard
            </Badge>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Welcome back, {session.username}! 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Your complete mind and body wellness journey starts here.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-400 fill-amber-400" />

            <div>
              <div className="text-xl font-bold text-white">
                {currentStreak} Days
              </div>

              <div className="text-xs text-slate-400">
                Current Streak
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Stats */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard
            title="BMI"
            value={profile?.currentBmi?.toFixed(1) ?? "—"}
            subtitle={
              profile?.bmiCategory
                ? profile.bmiCategory
                : "Not calculated yet"
            }
            icon={<Activity className="h-5 w-5 text-brand-400" />}
            badgeText={profile?.bmiCategory ?? "Pending"}
            badgeVariant="brand"
          />

          <StatCard
            title="Today's Calories"
            value={`${Math.round(todayCalories)} kcal`}
            subtitle="Estimated activity"
            icon={<Flame className="h-5 w-5 text-amber-400" />}
            badgeText={todayCalories > 0 ? "Active" : "Start"}
            badgeVariant="amber"
          />

          <StatCard
            title="Water Intake"
            value={`${todayWater.toLocaleString()} ml`}
            subtitle={`of ${waterGoal.toLocaleString()} ml goal`}
            icon={<Droplets className="h-5 w-5 text-cyan-400" />}
            badgeText={`${waterPercentage}%`}
            badgeVariant="cyan"
          />

          <StatCard
            title="SmartFit XP"
            value={`${currentXP.toLocaleString()} XP`}
            subtitle={`${xpPercentage}% toward next level`}
            icon={<Trophy className="h-5 w-5 text-purple-400" />}
            badgeText={`Level ${currentLevel}`}
            badgeVariant="amber"
          />

        </div>
      </section>

      {/* Today's Plan */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <Card className="lg:col-span-7 border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Wellness Plan</CardTitle>
                <CardDescription>
                  Your recommended activities for today
                </CardDescription>
              </div>

              <Badge variant="brand">Daily Plan</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">

            <Link href="/fitness">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4 hover:bg-slate-800/70 transition">
                <div className="flex items-center gap-3">
                  <Dumbbell className="h-5 w-5 text-brand-400" />

                  <div>
                    <div className="font-semibold text-white">
                      Complete Today's Workout
                    </div>

                    <div className="text-xs text-slate-400">
                      Strength & Core • 20 minutes
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </Link>

            <Link href="/meditation">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4 hover:bg-slate-800/70 transition">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-400" />

                  <div>
                    <div className="font-semibold text-white">
                      Mindfulness Session
                    </div>

                    <div className="text-xs text-slate-400">
                      Guided meditation • 10 minutes
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </Link>

            <Link href="/chess">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-4 hover:bg-slate-800/70 transition">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-amber-400" />

                  <div>
                    <div className="font-semibold text-white">
                      Daily Chess Challenge
                    </div>

                    <div className="text-xs text-slate-400">
                      Solve today's tactical puzzle
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-500" />
              </div>
            </Link>

          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="lg:col-span-5 border-slate-800 bg-slate-900/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  Your SmartFit journey
                </CardDescription>
              </div>

              <Target className="h-5 w-5 text-brand-400" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">
                  Level {currentLevel} → Level {currentLevel + 1}
                </span>

                <span className="font-semibold text-brand-400">
                  {currentXP} / {nextLevelXP} XP
                </span>
              </div>

              <Progress value={xpPercentage} variant="brand" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">
                  Hydration Goal
                </span>

                <span className="font-semibold text-cyan-400">
                  {waterPercentage}%
                </span>
              </div>

              <Progress value={waterPercentage} variant="cyan" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400">
                  Daily Wellness
                </span>

                <span className="font-semibold text-amber-400">
                  {todayCalories > 0 ? "Active" : "Not started"}
                </span>
              </div>

              <Progress
                value={todayCalories > 0 ? 65 : 0}
                variant="amber"
              />
            </div>

          </CardContent>
        </Card>
      </section>

      {/* Quick Access */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Quick Access
            </h2>

            <p className="text-xs text-slate-400">
              Jump directly into your SmartFit modules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

          <Link href="/trainer">
            <Button variant="secondary" className="w-full">
              Trainer
            </Button>
          </Link>

          <Link href="/fitness">
            <Button variant="secondary" className="w-full">
              Fitness
            </Button>
          </Link>

          <Link href="/wellness">
            <Button variant="secondary" className="w-full">
              Wellness
            </Button>
          </Link>

          <Link href="/meditation">
            <Button variant="secondary" className="w-full">
              Meditation
            </Button>
          </Link>

          <Link href="/chess">
            <Button variant="secondary" className="w-full">
              Chess
            </Button>
          </Link>

          <Link href="/challenges">
            <Button variant="secondary" className="w-full">
              Challenges
            </Button>
          </Link>

        </div>
      </section>

      {/* Daily Challenge */}
      <section>
        <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-slate-900">
          <CardContent className="p-6">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Trophy className="h-6 w-6 text-amber-400" />
                </div>

                <div>
                  <Badge variant="amber" className="mb-1">
                    Today's Challenge
                  </Badge>

                  <h3 className="font-bold text-white">
                    Complete one fitness or cognitive activity
                  </h3>

                  <p className="text-xs text-slate-400">
                    Earn +50 XP and maintain your streak.
                  </p>
                </div>

              </div>

              <Link href="/challenges">
                <Button className="flex items-center gap-2">
                  View Challenge
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>

            </div>

          </CardContent>
        </Card>
      </section>

    </div>
  );
}