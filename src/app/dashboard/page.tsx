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
import { generateFitnessGuidance } from "@/lib/validations/profile";
import { getLevelProgress, getEffectiveStreak, seedChallengesIfEmpty } from "@/lib/gamification";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ onboarding?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  await seedChallengesIfEmpty();

  const params = searchParams ? await searchParams : {};
  const justCompletedOnboarding = params.onboarding === "success";

  const [user, todayChallenge] = await Promise.all([
    prisma.user.findUnique({
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
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 4,
        },
        wellnessCheckIns: {
          orderBy: { checkedInAt: "desc" },
          take: 1,
        },
        meditationLogs: {
          orderBy: { completedAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.challenge.findFirst({
      where: { endDate: { gte: new Date() }, type: "daily" },
      include: {
        userProgress: {
          where: { userId: session.id },
        },
      },
    }),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const profile = user.profile;
  const gamification = user.gamification;
  const isProfileIncomplete =
    !profile || !profile.heightCm || !profile.weightKg || !profile.fitnessGoal;

  const guidance = generateFitnessGuidance({
    fitnessGoal: profile?.fitnessGoal,
    bmiCategory: profile?.bmiCategory,
    bmi: profile?.currentBmi,
    activityLevel: profile?.activityLevel,
    gender: profile?.gender,
    targetCalories: profile?.targetCalories,
    weightKg: profile?.weightKg,
  });

  const waterGoal =
    user.waterPreference?.dailyTargetMl ?? guidance.hydrationTargetMl ?? 2500;

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

  const todayCheckIn = user.wellnessCheckIns.find(
    (c) => new Date(c.checkedInAt) >= today
  );

  const todayMeditations = user.meditationLogs.filter(
    (m) => new Date(m.completedAt) >= today
  ).length;

  const waterPercentage = Math.min(
    Math.round((todayWater / waterGoal) * 100),
    100
  );

  const levelInfo = getLevelProgress(gamification?.totalXP ?? 0);
  const streakInfo = getEffectiveStreak(gamification);

  const currentXP = levelInfo.totalXP;
  const currentLevel = levelInfo.currentLevel;
  const nextLevelXP = levelInfo.nextXP;
  const xpPercentage = levelInfo.progressPercentage;
  const currentStreak = streakInfo.currentStreak;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

      {/* Onboarding Success Celebration Banner */}
      {justCompletedOnboarding && (
        <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Fitness Profile Configured! +50 XP Awarded 🔥
              </h3>
              <p className="text-xs text-brand-300">
                Your screening BMI, daily energy guidance, and personalized roadmap are now active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Profile Prompt Banner */}
      {isProfileIncomplete && !justCompletedOnboarding && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Fitness Profile Setup Pending
              </h3>
              <p className="text-xs text-slate-300">
                Complete your quick 2-minute biometrics scan to unlock accurate WHO BMI categorization, daily calorie estimates, and tailored regimens.
              </p>
            </div>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <span>Complete Onboarding</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

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
              {guidance.headline} • {guidance.weeklyFrequency}
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
            title="Screening BMI"
            value={profile?.currentBmi ? `${profile.currentBmi.toFixed(1)}` : "—"}
            subtitle={
              profile?.bmiCategory
                ? `WHO Category: ${profile.bmiCategory.charAt(0).toUpperCase() + profile.bmiCategory.slice(1)}`
                : "Setup required"
            }
            icon={<Activity className="h-5 w-5 text-brand-400" />}
            badgeText={profile?.bmiCategory ? profile.bmiCategory.toUpperCase() : "PENDING"}
            badgeVariant={
              profile?.bmiCategory === "normal"
                ? "brand"
                : profile?.bmiCategory === "obesity"
                ? "rose"
                : "amber"
            }
          />

          <StatCard
            title="Daily Calorie Target"
            value={
              profile?.targetCalories
                ? `${profile.targetCalories.toLocaleString()} kcal`
                : todayCalories > 0
                ? `${Math.round(todayCalories)} kcal`
                : "—"
            }
            subtitle={
              profile?.targetCalories
                ? "Estimated daily target"
                : "Complete profile to estimate"
            }
            icon={<Flame className="h-5 w-5 text-amber-400" />}
            badgeText={profile?.targetCalories ? "Calibrated" : "Estimate"}
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

      {/* Personalized Roadmap Banner Card */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Personalized Fitness & Wellness Roadmap
              </h2>
              <p className="text-xs text-slate-400 capitalize">
                Goal: {profile?.fitnessGoal ? profile.fitnessGoal.replace("_", " ") : "Custom Plan"} • Category: {profile?.bmiCategory ? profile.bmiCategory : "Pending Screening"}
              </p>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" size="sm" className="text-xs">
              View Profile & History
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold">
              <Dumbbell className="h-4 w-4" />
              <span>Recommended Regimen</span>
            </div>
            <div className="text-sm font-bold text-white">
              {guidance.recommendedRoutine}
            </div>
            <p className="text-xs text-slate-400">
              {guidance.activityTip}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Flame className="h-4 w-4" />
              <span>Caloric Target Guidance</span>
            </div>
            <div className="text-sm font-bold text-white">
              {profile?.targetCalories ? `${profile.targetCalories.toLocaleString()} kcal/day` : "Calibrate in Profile"}
            </div>
            <p className="text-xs text-slate-400">
              {guidance.calorieAdvice}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
              <Brain className="h-4 w-4" />
              <span>Cognitive & Mudra Pairing</span>
            </div>
            <div className="text-sm font-bold text-white">
              {guidance.weeklyFrequency}
            </div>
            <p className="text-xs text-slate-400">
              {guidance.mindfulnessTip}
            </p>
          </div>
        </div>
      </section>

      {/* Mental Wellness & Mindfulness Summary Card */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Mental Wellness &amp; Mindfulness
              </h2>
              <p className="text-xs text-slate-400">
                {todayCheckIn
                  ? `Checked in today • Mood: ${todayCheckIn.mood.toUpperCase()} • Stress: ${todayCheckIn.stressLevel}/5`
                  : "Daily check-in pending • Take 1 minute to reflect and claim +25 XP"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/wellness">
              <Button variant="primary" size="sm" className="text-slate-950 font-bold text-xs">
                {todayCheckIn ? "Open Wellness Studio" : "Complete Daily Check-In"} <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Today&apos;s Meditation
            </div>
            <div className="text-sm font-bold text-white">
              {todayMeditations > 0 ? `${todayMeditations} Session${todayMeditations === 1 ? "" : "s"} Completed` : "Ready to practice"}
            </div>
            <p className="text-[11px] text-teal-400">
              {todayMeditations > 0 ? "Mindfulness logged today" : "Try 5-min Mindfulness of Breath"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Recommended Activity
            </div>
            <div className="text-sm font-bold text-white">
              Box Breathing Reset (4m)
            </div>
            <p className="text-[11px] text-slate-400">
              Gentle autonomic nervous system pacing
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Self-Care Streak
            </div>
            <div className="text-sm font-bold text-brand-400">
              {currentStreak} Days Consistent
            </div>
            <p className="text-[11px] text-slate-400">
              +20 XP daily wellness consistency reward
            </p>
          </div>
        </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <Link href="/trainer">
            <Button variant="secondary" className="w-full text-xs py-2">
              Trainer
            </Button>
          </Link>

          <Link href="/fitness">
            <Button variant="secondary" className="w-full text-xs py-2">
              Fitness
            </Button>
          </Link>

          <Link href="/wellness">
            <Button variant="secondary" className="w-full text-xs py-2">
              Wellness
            </Button>
          </Link>

          <Link href="/meditation">
            <Button variant="secondary" className="w-full text-xs py-2">
              Meditation
            </Button>
          </Link>

          <Link href="/chess">
            <Button variant="secondary" className="w-full text-xs py-2">
              Chess
            </Button>
          </Link>

          <Link href="/cognitive">
            <Button variant="secondary" className="w-full text-xs py-2">
              Cognitive
            </Button>
          </Link>

          <Link href="/challenges">
            <Button variant="secondary" className="w-full text-xs py-2">
              Challenges
            </Button>
          </Link>

          <Link href="/leaderboard">
            <Button variant="secondary" className="w-full text-xs py-2">
              Leaderboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Daily Challenge & Recent Activity Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Challenge */}
        <div className="lg:col-span-7">
          <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-slate-900 h-full flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                    <Trophy className="h-6 w-6 text-amber-400" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="amber">Today&apos;s Active Quest</Badge>
                      <span className="text-xs text-brand-400 font-bold">
                        +{todayChallenge?.xpReward ?? 50} XP
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">
                      {todayChallenge?.title ?? "Complete one fitness or cognitive activity"}
                    </h3>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {todayChallenge?.description ?? "Earn XP and maintain your daily streak consistency."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Status: {todayChallenge?.userProgress?.[0]?.isCompleted ? "Completed" : "In Progress"}
                </span>
                <Link href="/challenges">
                  <Button size="sm" className="flex items-center gap-1.5 text-xs">
                    <span>View Arena</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-5">
          <Card className="border-slate-800 bg-slate-900/80 h-full">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Activity & XP</CardTitle>
                <Badge variant="slate" className="text-[10px]">Audit Stream</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {user.activityLogs && user.activityLogs.length > 0 ? (
                user.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0 text-xs"
                  >
                    <span className="text-slate-300 truncate max-w-[200px]">{log.description}</span>
                    <Badge variant="amber" className="text-[10px] shrink-0 font-bold">
                      +{log.xpEarned} XP
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No activity logged yet today. Complete a workout or meditation to earn your first XP!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}