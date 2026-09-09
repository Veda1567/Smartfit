import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import {
  Flame,
  Trophy,
  Dumbbell,
  Brain,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { AchievementCard } from "@/components/ui/achievement-card";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";

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
    return null;
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
      chessStats: true,
    },
  });

  if (!user) {
    return null;
  }

  const profile = user.profile;
  const gamification = user.gamification;
  const chessStats = user.chessStats;

  const workoutMinutes = user.workoutSessions.reduce(
    (sum, workout) => sum + workout.durationMinutes,
    0
  );

  const mindfulMinutes = user.meditationLogs.reduce(
    (sum, meditation) => sum + meditation.durationMinutes,
    0
  );

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