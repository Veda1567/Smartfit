"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  awardUserXP,
  checkAndAwardAchievements,
  recordActivityForChallenges,
} from "@/lib/gamification";
import {
  calculateCameraSessionCalories,
  EXERCISE_CONFIGS,
  type ExerciseType,
} from "@/lib/pose-analysis";

/**
 * Server action to log water intake (e.g. 250ml or 500ml).
 */
export async function logWaterAction(amountMl: number = 250): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  totalToday?: number;
  goalReached?: boolean;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to log water hydration.",
    };
  }

  const validAmount = Math.max(50, Math.min(2000, Number(amountMl) || 250));

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get previous today total
    const existingLogs = await prisma.waterLog.findMany({
      where: {
        userId: session.id,
        loggedAt: { gte: today },
      },
    });

    const previousTotal = existingLogs.reduce((sum, l) => sum + l.amountMl, 0);

    // Get user water preference target
    const preference = await prisma.waterPreference.findUnique({
      where: { userId: session.id },
    });
    const targetMl = preference?.dailyTargetMl ?? 2500;

    // Create water log
    await prisma.waterLog.create({
      data: {
        userId: session.id,
        amountMl: validAmount,
        loggedAt: new Date(),
      },
    });

    const newTotal = previousTotal + validAmount;
    const goalReached = previousTotal < targetMl && newTotal >= targetMl;

    let message = `Logged +${validAmount} ml of water! 💧`;
    if (goalReached) {
      // Award +30 XP for reaching daily water goal
      await awardUserXP(
        session.id,
        30,
        "water_goal",
        `Reached daily hydration target (${newTotal}ml / ${targetMl}ml)`,
        { newTotal, targetMl }
      );
      await recordActivityForChallenges(session.id, "hydration", 1);
      await checkAndAwardAchievements(session.id);
      message = `Goal achieved! ${newTotal} ml reached today! +30 XP awarded 🔥`;
    }

    revalidatePath("/fitness");
    revalidatePath("/challenges");
    revalidatePath("/dashboard");

    return {
      success: true,
      message,
      totalToday: newTotal,
      goalReached,
    };
  } catch (error) {
    console.error("Failed to log water:", error);
    return {
      success: false,
      error: "Could not log water intake.",
    };
  }
}

/**
 * Server action to reset today's logged water intake.
 */
export async function resetWaterAction(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to reset water logs.",
    };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.waterLog.deleteMany({
      where: {
        userId: session.id,
        loggedAt: { gte: today },
      },
    });

    revalidatePath("/fitness");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Today's water logs have been reset.",
    };
  } catch (error) {
    console.error("Failed to reset water logs:", error);
    return {
      success: false,
      error: "Could not reset water logs.",
    };
  }
}

/**
 * Server action to update water hydration preferences.
 */
export async function updateWaterPreferenceAction(data: {
  dailyTargetMl: number;
  reminderIntervalMinutes?: number;
  enableAudio?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to update preferences.",
    };
  }

  try {
    await prisma.waterPreference.upsert({
      where: { userId: session.id },
      update: {
        dailyTargetMl: data.dailyTargetMl,
        reminderIntervalMinutes: data.reminderIntervalMinutes ?? 60,
        enableAudio: data.enableAudio ?? true,
      },
      create: {
        userId: session.id,
        dailyTargetMl: data.dailyTargetMl,
        reminderIntervalMinutes: data.reminderIntervalMinutes ?? 60,
        enableAudio: data.enableAudio ?? true,
      },
    });

    revalidatePath("/fitness");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Hydration preferences saved.",
    };
  } catch (error) {
    console.error("Failed to update water preferences:", error);
    return {
      success: false,
      error: "Could not save preferences.",
    };
  }
}

export interface LogCameraSessionInput {
  exercise: ExerciseType;
  durationSeconds: number;
  totalReps: number;
  correctReps: number;
  formWarnings: number;
  averageFormScore: number;
}

/**
 * Server action to log completed AI Camera Form Coach workouts.
 * Strictly validates all rep counts, durations, and XP server-side.
 */
export async function logCameraWorkoutSessionAction(input: LogCameraSessionInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  xpEarned?: number;
  unlockedAchievement?: string | null;
  savedSession?: {
    id: string;
    routineTitle: string;
    durationMinutes: number;
    estimatedCaloriesBurned: number | null;
    completedAt: string;
    notes: string | null;
  };
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to record AI camera sessions and earn XP.",
    };
  }

  const validExercises: ExerciseType[] = ["squat", "pushup", "bicep_curl"];
  if (!validExercises.includes(input.exercise)) {
    return {
      success: false,
      error: "Invalid exercise type provided.",
    };
  }

  const durationSec = Math.max(0, Math.min(10800, Math.round(Number(input.durationSeconds) || 0)));
  if (durationSec < 15) {
    return {
      success: false,
      error: "Camera session must be at least 15 seconds to be recorded.",
    };
  }

  // Rate sanity check: cannot physically perform > 1 full rep every 1.2s
  const maxPossibleReps = Math.floor(durationSec / 1.2);
  const clientReportedTotal = Math.max(0, Math.round(Number(input.totalReps) || 0));
  const clientReportedCorrect = Math.max(0, Math.round(Number(input.correctReps) || 0));
  const clientReportedWarnings = Math.max(0, Math.round(Number(input.formWarnings) || 0));

  const verifiedTotalReps = Math.min(clientReportedTotal, maxPossibleReps);
  const verifiedCorrectReps = Math.min(clientReportedCorrect, verifiedTotalReps);
  const sanitizedWarnings = Math.min(clientReportedWarnings, verifiedTotalReps);
  const sanitizedFormScore = Math.max(0, Math.min(100, Math.round(Number(input.averageFormScore) || 0)));

  try {
    const now = new Date();
    const ninetySecondsAgo = new Date(now.getTime() - 90 * 1000);

    // 1. Check for rapid repeated submissions (cooldown)
    const recentSession = await prisma.workoutSession.findFirst({
      where: {
        userId: session.id,
        completedAt: { gte: ninetySecondsAgo },
      },
    });

    if (recentSession) {
      return {
        success: false,
        error: "A workout session was recorded recently. Please allow a 90-second cooldown.",
      };
    }

    // 2. Fetch user profile for weight calculation
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.id },
    });
    const userWeightKg = userProfile?.weightKg ?? 70;

    const durationMinutes = Math.max(1, Math.round(durationSec / 60));
    const estimatedCalories = calculateCameraSessionCalories(
      input.exercise,
      durationMinutes,
      verifiedTotalReps,
      userWeightKg
    );

    const config = EXERCISE_CONFIGS[input.exercise];
    const routineTitle = `AI Camera: ${config.label} (${verifiedTotalReps} reps)`;
    const notes = `Form Quality: ${sanitizedFormScore}% • ${verifiedCorrectReps}/${verifiedTotalReps} clean reps • ${sanitizedWarnings} warnings`;

    // 3. Persist workout session
    const saved = await prisma.workoutSession.create({
      data: {
        userId: session.id,
        routineTitle,
        durationMinutes,
        estimatedCaloriesBurned: estimatedCalories,
        notes,
        completedAt: now,
      },
    });

    // 4. Server-side XP calculation
    let xpEarned = 0;
    let unlockedAchievement: string | null = null;

    // Minimum criteria for XP: at least 30 seconds and at least 3 verified correct reps
    if (durationSec >= 30 && verifiedCorrectReps >= 3) {
      const baseXP = 30;
      const repBonus = Math.min(40, verifiedCorrectReps * 3);
      const formBonus = sanitizedFormScore >= 85 ? 15 : sanitizedFormScore >= 70 ? 5 : 0;
      xpEarned = Math.min(85, baseXP + repBonus + formBonus);

      await awardUserXP(
        session.id,
        xpEarned,
        "camera_workout",
        `AI Camera Coach: ${config.label} (${verifiedCorrectReps} clean reps)`,
        { exercise: input.exercise, verifiedCorrectReps, verifiedTotalReps, sanitizedFormScore }
      );

      await recordActivityForChallenges(session.id, "fitness", 1);
      const unlocked = await checkAndAwardAchievements(session.id);
      if (unlocked && unlocked.length > 0) {
        unlockedAchievement = unlocked[0];
      }
    }

    revalidatePath("/fitness");
    revalidatePath("/trainer");
    revalidatePath("/challenges");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    const message = xpEarned > 0
      ? `AI Camera workout logged! +${xpEarned} XP awarded 🔥 (${verifiedCorrectReps} clean reps recorded)`
      : `AI Camera workout saved to history (${verifiedTotalReps} reps). Complete at least 3 clean reps (30s+) to earn XP!`;

    return {
      success: true,
      message,
      xpEarned,
      unlockedAchievement,
      savedSession: {
        id: saved.id,
        routineTitle: saved.routineTitle,
        durationMinutes: saved.durationMinutes,
        estimatedCaloriesBurned: saved.estimatedCaloriesBurned,
        completedAt: saved.completedAt.toISOString(),
        notes: saved.notes,
      },
    };
  } catch (err) {
    console.error("Failed to log camera workout session:", err);
    return {
      success: false,
      error: "Failed to record camera workout session.",
    };
  }
}

