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
 * Server action to log a completed workout session with XP award.
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

  if (!data.routineTitle || data.durationMinutes <= 0) {
    return {
      success: false,
      error: "Please provide valid workout session details.",
    };
  }

  try {
    await prisma.workoutSession.create({
      data: {
        userId: session.id,
        routineTitle: data.routineTitle,
        durationMinutes: data.durationMinutes,
        estimatedCaloriesBurned: data.estimatedCaloriesBurned ?? 200,
        notes: data.notes,
        completedAt: new Date(),
      },
    });

    // Award standard +100 XP for completed workout
    const xpResult = await awardUserXP(session.id, 100, "workout_session");

    // Check for First Step Forward achievement
    const unlockedAchievement = await checkAndAwardWorkoutAchievements(session.id);

    revalidatePath("/trainer");
    revalidatePath("/fitness");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    const message = unlockedAchievement
      ? `Workout session recorded! +100 XP awarded 🔥 Achievement Unlocked: ${unlockedAchievement} (+50 XP)!`
      : "Workout session recorded! +100 XP awarded 🔥";

    return {
      success: true,
      message,
      xpEarned: 100 + (unlockedAchievement ? 50 : 0),
      unlockedAchievement,
    };
  } catch (error) {
    console.error("Failed to log workout session:", error);
    return {
      success: false,
      error: "Failed to save workout session.",
    };
  }
}
