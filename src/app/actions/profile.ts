"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateProfileInput,
  calculateBmi,
  estimateTargetCalories,
  type ProfileActionState,
} from "@/lib/validations/profile";
import { awardUserXP } from "@/lib/gamification";

export async function updateProfileAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to update your profile.",
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

  // Automatically estimate reasonable daily calories if not manually supplied
  const finalTargetCalories =
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
    // Upsert profile strictly for the authenticated session's user ID
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
        targetCalories: finalTargetCalories,
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
        targetCalories: finalTargetCalories,
        currentBmi,
        bmiCategory,
      },
    });

    // If both height and weight are provided, log a historical BMI entry
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

    // Award +30 XP for updating biometrics/profile
    await awardUserXP(session.id, 30, "profile_update");

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/trainer");
    revalidatePath("/fitness");

    return {
      success: true,
      message: "Profile and biometrics updated successfully! +30 XP awarded 🔥",
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      success: false,
      error: "Unable to update profile right now. Please try again later.",
    };
  }
}

export async function saveOnboardingAction(
  _prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to complete onboarding.",
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

  // For onboarding, require core fields
  if (!values.heightCm) {
    errors.heightCm = errors.heightCm || "Height is required.";
  }
  if (!values.weightKg) {
    errors.weightKg = errors.weightKg || "Weight is required.";
  }
  if (!values.fitnessGoal) {
    errors.fitnessGoal = errors.fitnessGoal || "Please select a fitness goal.";
  }
  if (!values.activityLevel) {
    errors.activityLevel = errors.activityLevel || "Please select your activity level.";
  }

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

  const finalTargetCalories =
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
        targetCalories: finalTargetCalories,
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
        targetCalories: finalTargetCalories,
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

    // Award +50 XP for completing fitness onboarding
    await awardUserXP(session.id, 50, "fitness_onboarding_completed");

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/trainer");
    revalidatePath("/fitness");
  } catch (error) {
    console.error("Failed to save onboarding:", error);
    return {
      success: false,
      error: "Unable to save your fitness profile right now. Please try again.",
    };
  }

  redirect("/dashboard?onboarding=success");
}

