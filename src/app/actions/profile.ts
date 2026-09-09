"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  validateProfileInput,
  calculateBmi,
  type ProfileActionState,
} from "@/lib/validations/profile";

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
        targetCalories: values.targetCalories,
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
        targetCalories: values.targetCalories,
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

    revalidatePath("/profile");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profile updated successfully!",
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      success: false,
      error: "Unable to update profile right now. Please try again later.",
    };
  }
}
