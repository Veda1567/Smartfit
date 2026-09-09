import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { FitnessInteractive, type FitnessInitialData } from "@/components/fitness/fitness-interactive";

export default async function FitnessDashboardPage() {
  const session = await getSession();

  let profileData: FitnessInitialData["profile"] = null;
  let isProfileIncomplete = false;

  let todayWaterMl = 1250;
  let dailyTargetMl = 2500;
  let todayCaloriesBurned = 0;
  let todayWorkoutsCount = 0;
  let lastWorkoutTitle: string | null = null;
  let weeklyWorkoutsCount = 0;
  let weeklyMinutesTrained = 0;
  let totalWorkoutsCount = 0;
  let currentStreak = 0;
  let totalXP = 0;
  let currentLevel = 1;

  let recentWorkoutSessions: FitnessInitialData["recentWorkoutSessions"] = [];
  let recentBmiRecords: FitnessInitialData["recentBmiRecords"] = [];

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        waterPreference: true,
        waterLogs: {
          orderBy: { loggedAt: "desc" },
          take: 50,
        },
        workoutSessions: {
          orderBy: { completedAt: "desc" },
          take: 20,
        },
        bmiRecords: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
        gamification: true,
      },
    });

    if (user) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Hydration calculation
      todayWaterMl = user.waterLogs
        .filter((l) => new Date(l.loggedAt) >= startOfToday)
        .reduce((sum, l) => sum + l.amountMl, 0);

      dailyTargetMl =
        user.waterPreference?.dailyTargetMl ??
        (user.profile?.weightKg
          ? Math.min(4000, Math.max(2000, Math.round((user.profile.weightKg * 35) / 250) * 250))
          : 2500);

      // Workouts Today
      const todayWorkouts = user.workoutSessions.filter(
        (w) => new Date(w.completedAt) >= startOfToday
      );
      todayWorkoutsCount = todayWorkouts.length;
      todayCaloriesBurned = Math.round(
        todayWorkouts.reduce((sum, w) => sum + (w.estimatedCaloriesBurned ?? 0), 0)
      );
      lastWorkoutTitle =
        todayWorkouts.length > 0
          ? todayWorkouts[0].routineTitle
          : (user.workoutSessions[0]?.routineTitle ?? null);

      // Weekly Workouts
      const weeklyWorkouts = user.workoutSessions.filter(
        (w) => new Date(w.completedAt) >= oneWeekAgo
      );
      weeklyWorkoutsCount = weeklyWorkouts.length;
      weeklyMinutesTrained = weeklyWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
      totalWorkoutsCount = user.workoutSessions.length;

      // Gamification
      currentStreak = user.gamification?.currentStreak ?? 0;
      totalXP = user.gamification?.totalXP ?? 0;
      currentLevel = user.gamification?.currentLevel ?? 1;

      // Profile & Completeness
      if (user.profile) {
        profileData = {
          age: user.profile.age,
          gender: user.profile.gender,
          heightCm: user.profile.heightCm,
          weightKg: user.profile.weightKg,
          fitnessGoal: user.profile.fitnessGoal,
          activityLevel: user.profile.activityLevel,
          currentBmi: user.profile.currentBmi,
          bmiCategory: user.profile.bmiCategory,
          targetCalories: user.profile.targetCalories,
        };

        isProfileIncomplete =
          !user.profile.heightCm ||
          !user.profile.weightKg ||
          !user.profile.fitnessGoal;
      } else {
        isProfileIncomplete = true;
      }

      // Recent Workout Sessions
      recentWorkoutSessions = user.workoutSessions.slice(0, 8).map((ws) => ({
        id: ws.id,
        routineTitle: ws.routineTitle,
        durationMinutes: ws.durationMinutes,
        estimatedCaloriesBurned: ws.estimatedCaloriesBurned,
        completedAt: ws.completedAt.toISOString(),
        notes: ws.notes,
      }));

      // Recent BMI Records
      recentBmiRecords = user.bmiRecords.map((br) => ({
        id: br.id,
        weightKg: br.weightKg,
        heightCm: br.heightCm,
        bmi: br.bmi,
        recordedAt: br.recordedAt.toISOString(),
      }));
    }
  }

  return (
    <FitnessInteractive
      session={session}
      initialData={{
        profile: profileData,
        isProfileIncomplete,
        todayWaterMl,
        dailyTargetMl,
        todayCaloriesBurned,
        todayWorkoutsCount,
        lastWorkoutTitle,
        weeklyWorkoutsCount,
        weeklyMinutesTrained,
        totalWorkoutsCount,
        currentStreak,
        totalXP,
        currentLevel,
        recentWorkoutSessions,
        recentBmiRecords,
      }}
    />
  );
}
