import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import {
  Flame,
  Trophy,
  Dumbbell,
  Brain,
  Sparkles,
  Activity,
  History,
  Calendar,
  ChevronRight,
  Droplets,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { AchievementCard } from "@/components/ui/achievement-card";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { generateFitnessGuidance } from "@/lib/validations/profile";

function formatGoal(goal?: string | null) {
  if (!goal) return "Not set";
  return goal
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatActivity(activity?: string | null) {
  if (!activity) return "Not set";
  return activity
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatGender(gender?: string | null) {
  if (!gender) return "Not set";
  if (gender === "prefer_not_to_say") return "Prefer not to say";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    include: {
      profile: true,
      gamification: true,
      workoutSessions: true,
      meditationLogs: true,
      mudraProgress: true,
      wellnessCheckIns: {
        orderBy: {
          checkedInAt: "desc",
        },
        take: 5,
      },
      chessStats: true,
      bmiRecords: {
        orderBy: {
          recordedAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/profile");
  }

  const profile = user.profile;
  const gamification = user.gamification;
  const chessStats = user.chessStats;
  const bmiRecords = user.bmiRecords;

  const guidance = generateFitnessGuidance({
    fitnessGoal: profile?.fitnessGoal,
    bmiCategory: profile?.bmiCategory,
    bmi: profile?.currentBmi,
    activityLevel: profile?.activityLevel,
    gender: profile?.gender,
    targetCalories: profile?.targetCalories,
    weightKg: profile?.weightKg,
  });

  const workoutMinutes = user.workoutSessions.reduce(
    (sum, workout) => sum + workout.durationMinutes,
    0
  );

  const mindfulMinutes = user.meditationLogs.reduce(
    (sum, meditation) => sum + meditation.durationMinutes,
    0
  );

  const totalMudras = user.mudraProgress.reduce(
    (sum, m) => sum + m.practiceCount,
    0
  );

  const latestCheckIn = user.wellnessCheckIns[0] || null;

  const bmi = profile?.currentBmi;
  const bmiText = bmi ? bmi.toFixed(1) : "—";

  const achievements = [
    {
      title: "First Step Forward",
      description: "Completed your first logged workout session on SmartFit.",
      category: "physical" as const,
      xpReward: 50,
      isUnlocked: user.workoutSessions.length > 0,
      icon: <Dumbbell className="h-6 w-6" />,
    },
    {
      title: "7-Day Iron Streak",
      description: "Maintained active daily physical or mental workouts for 7 days.",
      category: "consistency" as const,
      xpReward: 100,
      isUnlocked: (gamification?.currentStreak ?? 0) >= 7,
      icon: <Flame className="h-6 w-6" />,
    },
    {
      title: "Tactical Checkmate",
      description: "Delivered checkmate in a match against Stockfish AI.",
      category: "chess" as const,
      xpReward: 80,
      isUnlocked: (chessStats?.wins ?? 0) > 0,
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "Mindful Master",
      description: "Accumulated 100+ minutes of guided meditation sessions.",
      category: "mental" as const,
      xpReward: 120,
      isUnlocked: mindfulMinutes >= 100,
      icon: <Sparkles className="h-6 w-6" />,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const xp = gamification?.totalXP ?? 0;
  const level = gamification?.currentLevel ?? 1;
  const nextLevelXP = level * 300;
  const xpProgress = Math.min(
    100,
    Math.round((xp / nextLevelXP) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">

      {/* Profile Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">

          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">

            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-500 text-slate-950 font-black text-3xl">
                {session.username.charAt(0).toUpperCase()}
              </div>

              <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 p-1 border border-slate-800">
                <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
              </span>
            </div>

            <div className="space-y-2">

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {session.username}
                </h1>

                <Badge variant="brand">
                  Level {level}
                </Badge>

                <Badge variant="amber">
                  {gamification?.currentStreak ?? 0}-Day Streak
                </Badge>
              </div>

              <p className="text-xs text-slate-400">
                SmartFit Member
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-xs text-slate-300">
                <span>
                  Height:{" "}
                  <strong className="text-white">
                    {profile?.heightCm ? `${profile.heightCm} cm` : "Not set"}
                  </strong>
                </span>

                <span>
                  Weight:{" "}
                  <strong className="text-white">
                    {profile?.weightKg ? `${profile.weightKg} kg` : "Not set"}
                  </strong>
                </span>

                <span>
                  BMI:{" "}
                  <strong className="text-brand-400">
                    {bmiText}
                  </strong>
                  {profile?.bmiCategory
                    ? ` (${profile.bmiCategory})`
                    : ""}
                </span>

                <span>
                  Age:{" "}
                  <strong className="text-white">
                    {profile?.age ? `${profile.age} yrs` : "Not set"}
                  </strong>
                </span>

                <span>
                  Gender:{" "}
                  <strong className="text-white">
                    {formatGender(profile?.gender)}
                  </strong>
                </span>

                <span>
                  Goal:{" "}
                  <strong className="text-white">
                    {formatGoal(profile?.fitnessGoal)}
                  </strong>
                </span>

                <span>
                  Activity:{" "}
                  <strong className="text-white">
                    {formatActivity(profile?.activityLevel)}
                  </strong>
                </span>

                {profile?.targetCalories && (
                  <span>
                    Target:{" "}
                    <strong className="text-brand-400">
                      {profile.targetCalories.toLocaleString()} kcal/day
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* EDIT PROFILE MODAL */}
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <EditProfileModal profile={profile} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Level {level}</span>
            <span className="text-brand-400">
              {xp} / {nextLevelXP} XP
            </span>
          </div>

          <Progress value={xpProgress} variant="brand" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Total Lifetime XP"
          value={`${xp} XP`}
          subtitle="Earned across SmartFit"
          icon={<Trophy className="h-5 w-5 text-amber-400" />}
          badgeText="Total"
          badgeVariant="amber"
        />

        <StatCard
          title="Workouts Completed"
          value={`${user.workoutSessions.length} Sessions`}
          subtitle={`${workoutMinutes} minutes logged`}
          icon={<Dumbbell className="h-5 w-5 text-brand-400" />}
          badgeText="Fitness"
          badgeVariant="brand"
        />

        <StatCard
          title="Chess Rating"
          value={`${chessStats?.eloRating ?? 1200} ELO`}
          subtitle={`${chessStats?.wins ?? 0} Wins • ${chessStats?.losses ?? 0} Losses`}
          icon={<Brain className="h-5 w-5 text-cyan-400" />}
          badgeText="Active"
          badgeVariant="cyan"
        />

        <StatCard
          title="Mindful Minutes"
          value={`${mindfulMinutes} mins`}
          subtitle="Meditation & breathwork"
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          badgeText="Zen"
          badgeVariant="slate"
        />

      </div>

      {/* Incomplete Profile Prompt Banner */}
      {(!profile?.heightCm || !profile?.weightKg || !profile?.fitnessGoal) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Complete Your Fitness Profile
              </h3>
              <p className="text-xs text-slate-300">
                Unlock accurate BMI classification, auto-calculated daily calorie targets, and customized workout regimens.
              </p>
            </div>
          </div>
          <Link href="/onboarding" className="shrink-0">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <span>Start Onboarding</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Personalized Roadmap Card */}
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
                Focus: {profile?.fitnessGoal ? profile.fitnessGoal.replace("_", " ") : "Custom Plan"} • Category: {profile?.bmiCategory ? profile.bmiCategory : "Pending Screening"}
              </p>
            </div>
          </div>
          <Badge variant="brand" className="text-xs">
            {guidance.weeklyFrequency}
          </Badge>
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
              <span>Calorie Guidance</span>
            </div>
            <div className="text-sm font-bold text-white">
              {profile?.targetCalories ? `${profile.targetCalories.toLocaleString()} kcal/day` : "Calculated on Save"}
            </div>
            <p className="text-xs text-slate-400">
              {guidance.calorieAdvice}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
              <Brain className="h-4 w-4" />
              <span>Mindfulness & Mudras</span>
            </div>
            <div className="text-sm font-bold text-white">
              Cognitive & Stress Modulation
            </div>
            <p className="text-xs text-slate-400">
              {guidance.mindfulnessTip}
            </p>
          </div>
        </div>
      </section>

      {/* BMI & Biometric History Log */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                BMI & Biometric Screening History
              </h3>
              <p className="text-xs text-slate-400">
                Logged historical body mass index data using WHO screening standards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Normal range: <strong className="text-brand-400">18.5 – 24.9</strong></span>
          </div>
        </div>

        {bmiRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Height</th>
                  <th className="py-2.5 px-3 font-semibold">Weight</th>
                  <th className="py-2.5 px-3 font-semibold">Screening BMI</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bmiRecords.map((record) => {
                  let cat = "Normal";
                  let catVariant: "brand" | "amber" | "rose" = "brand";
                  if (record.bmi < 18.5) {
                    cat = "Underweight";
                    catVariant = "amber";
                  } else if (record.bmi < 25) {
                    cat = "Normal";
                    catVariant = "brand";
                  } else if (record.bmi < 30) {
                    cat = "Overweight";
                    catVariant = "amber";
                  } else {
                    cat = "Obesity";
                    catVariant = "rose";
                  }

                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {new Date(record.recordedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-200">{record.heightCm} cm</td>
                      <td className="py-3 px-3 text-slate-200">{record.weightKg} kg</td>
                      <td className="py-3 px-3 font-bold text-white">{record.bmi.toFixed(1)}</td>
                      <td className="py-3 px-3">
                        <Badge variant={catVariant} className="text-[10px] capitalize">
                          {cat}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 text-center space-y-2">
            <p className="text-sm text-slate-400">
              No BMI history logged yet.
            </p>
            <p className="text-xs text-slate-500">
              Use &ldquo;Edit Profile&rdquo; above or complete onboarding to record your first height and weight.
            </p>
          </div>
        )}
      </section>

      {/* Mental Wellness & Mindfulness Summary Card */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Mental Wellness &amp; Mindfulness Summary
              </h3>
              <p className="text-xs text-slate-400">
                Self-care records, meditation volume, and mindful hand postures
              </p>
            </div>
          </div>

          <Link href="/wellness">
            <Button variant="secondary" size="sm" className="text-xs flex items-center gap-1">
              Open Wellness Studio <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Latest Daily Check-In
            </div>
            <div className="text-sm font-bold text-white">
              {latestCheckIn ? `Mood: ${latestCheckIn.mood.toUpperCase()}` : "No check-in yet"}
            </div>
            <p className="text-xs text-slate-400">
              {latestCheckIn
                ? `Stress: ${latestCheckIn.stressLevel}/5 • Energy: ${latestCheckIn.energyLevel}/5 (${new Date(latestCheckIn.checkedInAt).toLocaleDateString()})`
                : "Check in daily on /wellness to claim +25 XP"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Meditation Practice
            </div>
            <div className="text-sm font-bold text-teal-400">
              {user.meditationLogs.length} Sessions Logged
            </div>
            <p className="text-xs text-slate-400">
              {mindfulMinutes} total minutes in mindful stillness
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Yogic Mudras Practiced
            </div>
            <div className="text-sm font-bold text-amber-400">
              {totalMudras} Practice Sessions
            </div>
            <p className="text-xs text-slate-400">
              Traditional postural gestures recorded
            </p>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              Trophy Room & Badges
            </h3>

            <p className="text-xs text-slate-400">
              Milestone achievements earned throughout your journey
            </p>
          </div>

          <Badge variant="amber">
            {unlockedCount} Unlocked / {achievements.length - unlockedCount} Locked
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={index}
              {...achievement}
            />
          ))}
        </div>

      </div>

    </div>
  );
}