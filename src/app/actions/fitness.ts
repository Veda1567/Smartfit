"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { awardUserXP } from "@/lib/gamification";

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
      await awardUserXP(session.id, 30, "water_daily_goal_reached");
      message = `Goal achieved! ${newTotal} ml reached today! +30 XP awarded 🔥`;
    }

    revalidatePath("/fitness");
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
