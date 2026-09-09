import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { FitnessInteractive } from "@/components/fitness/fitness-interactive";

export default async function FitnessDashboardPage() {
  const session = await getSession();

  let todayWaterMl = 1500;
  let dailyTargetMl = 2500;
  let todayCalories = 0;
  let todayWorkoutTitle: string | null = null;
  let currentStreak = 0;
  let userGoal: string | null = "weight_loss";

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        waterPreference: true,
        waterLogs: true,
        workoutSessions: true,
        gamification: true,
      },
    });

    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      todayWaterMl = user.waterLogs
        .filter((l) => new Date(l.loggedAt) >= today)
        .reduce((sum, l) => sum + l.amountMl, 0);

      dailyTargetMl = user.waterPreference?.dailyTargetMl ?? 2500;

      const todayWorkouts = user.workoutSessions.filter(
        (w) => new Date(w.completedAt) >= today
      );

      todayCalories = Math.round(
        todayWorkouts.reduce((sum, w) => sum + (w.estimatedCaloriesBurned ?? 0), 0)
      );

      todayWorkoutTitle =
        todayWorkouts.length > 0
          ? todayWorkouts[todayWorkouts.length - 1].routineTitle
          : null;

      currentStreak = user.gamification?.currentStreak ?? 0;
      userGoal = user.profile?.fitnessGoal ?? "weight_loss";
    }
  }

  return (
    <FitnessInteractive
      session={session}
      initialData={{
        todayWaterMl,
        dailyTargetMl,
        todayCalories,
        todayWorkoutTitle,
        currentStreak,
        userGoal,
      }}
    />
  );
}
