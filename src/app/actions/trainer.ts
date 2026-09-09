"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  validateProfileInput,
  calculateBmi,
  estimateTargetCalories,
  type ProfileActionState,
} from "@/lib/validations/profile";
import { awardUserXP, checkAndAwardWorkoutAchievements } from "@/lib/gamification";

export type TrainerActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  xpEarned?: number;
  newLevel?: number;
};

/**
 * Server action to update user biometrics & trainer guidance directly from /trainer.
 */
export async function updateTrainerGuidanceAction(
  _prevState: TrainerActionState | null,
  formData: FormData
): Promise<TrainerActionState> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to save your fitness guidance.",
    };
  }

  const { values, errors } = validateProfileInput({
    age: formData.get("age")?.toString(),
    gender: formData.get("gender")?.toString(),
    heightCm: formData.get("heightCm")?.toString(),
    weightKg: formData.get("weightKg")?.toString(),
    fitnessGoal: formData.get("fitnessGoal")?.toString(),
    activityLevel: formData.get("activityLevel")?.toString(),
    targetCalories: formData.get("targetCalories")?.toString(),
  });

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      fieldErrors: errors,
    };
  }

  const { bmi: currentBmi, category: bmiCategory } = calculateBmi(
    values.heightCm,
    values.weightKg
  );

  const estimatedCalories =
    values.targetCalories ??
    estimateTargetCalories({
      heightCm: values.heightCm,
      weightKg: values.weightKg,
      age: values.age,
      gender: values.gender,
      activityLevel: values.activityLevel,
      fitnessGoal: values.fitnessGoal,
    });

  try {
    await prisma.profile.upsert({
      where: {
        userId: session.id,
      },
      update: {
        age: values.age,
        gender: values.gender,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        fitnessGoal: values.fitnessGoal,
        activityLevel: values.activityLevel,
        targetCalories: estimatedCalories,
        currentBmi,
        bmiCategory,
      },
      create: {
        userId: session.id,
        age: values.age,
        gender: values.gender,
        heightCm: values.heightCm,
        weightKg: values.weightKg,
        fitnessGoal: values.fitnessGoal,
        activityLevel: values.activityLevel,
        targetCalories: estimatedCalories,
        currentBmi,
        bmiCategory,
      },
    });

    if (values.heightCm && values.weightKg && currentBmi !== null) {
      await prisma.bmiRecord.create({
        data: {
          userId: session.id,
          heightCm: values.heightCm,
          weightKg: values.weightKg,
          bmi: currentBmi,
        },
      });
    }

    // Award +30 XP for biometric review / guidance update
    const xpResult = await awardUserXP(session.id, 30, "trainer_biometrics_update");

    revalidatePath("/trainer");
    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Fitness guidance & biometrics updated successfully! +30 XP awarded 🔥",
      xpEarned: 30,
      newLevel: xpResult.currentLevel,
    };
  } catch (error) {
    console.error("Failed to update trainer guidance:", error);
    return {
      success: false,
      error: "An unexpected error occurred while saving your fitness guidance.",
    };
  }
}

/**
 * Server action to log a completed workout session with server-side XP award and duplicate prevention.
 */
export async function logWorkoutSessionAction(data: {
  routineTitle: string;
  durationMinutes: number;
  estimatedCaloriesBurned?: number;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  xpEarned?: number;
  unlockedAchievement?: string | null;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to log workout sessions.",
    };
  }

  const routineTitle = (data.routineTitle || "").trim().slice(0, 120);
  const durationMinutes = Math.max(1, Math.min(360, Math.round(Number(data.durationMinutes) || 0)));
  const estimatedCalories = Math.max(
    10,
    Math.min(3000, Math.round(Number(data.estimatedCaloriesBurned) || 200))
  );
  const notes = data.notes ? data.notes.trim().slice(0, 500) : undefined;

  if (routineTitle.length < 2) {
    return {
      success: false,
      error: "Please provide a valid workout routine title.",
    };
  }

  if (durationMinutes <= 0) {
    return {
      success: false,
      error: "Please specify a valid workout duration in minutes.",
    };
  }

  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Check for rapid repeated submissions within 2 minutes (prevent accidental double clicking)
    const recentDuplicate = await prisma.workoutSession.findFirst({
      where: {
        userId: session.id,
        completedAt: { gte: twoMinutesAgo },
      },
    });

    if (recentDuplicate) {
      return {
        success: false,
        error: "A workout session was recorded just a moment ago. Please allow a brief cooldown.",
      };
    }

    // 2. Check if this routine was already completed today by this user
    const alreadyCompletedToday = await prisma.workoutSession.findFirst({
      where: {
        userId: session.id,
        routineTitle,
        completedAt: { gte: startOfToday },
      },
    });

    // 3. Persist the workout session
    await prisma.workoutSession.create({
      data: {
        userId: session.id,
        routineTitle,
        durationMinutes,
        estimatedCaloriesBurned: estimatedCalories,
        notes,
        completedAt: now,
      },
    });

    let xpEarned = 0;
    let unlockedAchievement: string | null = null;
    let message: string;

    if (alreadyCompletedToday) {
      // Session logged for training history, but no duplicate XP awarded
      message = `Workout session saved to your fitness history! (Daily XP for "${routineTitle}" was already claimed earlier today).`;
    } else {
      // First completion today: Award standard +100 XP
      await awardUserXP(session.id, 100, "workout_session");
      xpEarned = 100;

      // Check for first workout achievement
      unlockedAchievement = await checkAndAwardWorkoutAchievements(session.id);
      if (unlockedAchievement) {
        xpEarned += 50;
      }

      message = unlockedAchievement
        ? `Workout completed! +100 XP awarded 🔥 Achievement Unlocked: ${unlockedAchievement} (+50 XP)!`
        : `Workout completed! +100 XP awarded 🔥 Keep up the momentum!`;
    }

    revalidatePath("/trainer");
    revalidatePath("/fitness");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
      unlockedAchievement,
    };
  } catch (error) {
    console.error("Failed to log workout session:", error);
    return {
      success: false,
      error: "Failed to save workout session to database.",
    };
  }
}
