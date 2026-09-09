"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { awardUserXP } from "@/lib/gamification";
import {
  validateWellnessCheckIn,
  type WellnessCheckInInput,
} from "@/lib/wellness";

export interface WellnessActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  xpEarned?: number;
}

/**
 * Server action to record daily wellness check-in (mood, stress, energy, sleep, notes).
 * Awards +25 XP on the user's first check-in of each day.
 */
export async function recordWellnessCheckInAction(
  data: WellnessCheckInInput
): Promise<WellnessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to record your daily wellness check-in.",
    };
  }

  const { values, errors } = validateWellnessCheckIn(data);

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      fieldErrors: errors,
    };
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if user already checked in today
    const existingToday = await prisma.wellnessCheckIn.findFirst({
      where: {
        userId: session.id,
        checkedInAt: { gte: startOfToday },
      },
      orderBy: { checkedInAt: "desc" },
    });

    // Save check-in to database
    await prisma.wellnessCheckIn.create({
      data: {
        userId: session.id,
        mood: values.mood,
        stressLevel: values.stressLevel,
        energyLevel: values.energyLevel,
        sleepQuality: values.sleepQuality,
        notes: values.notes,
        checkedInAt: now,
      },
    });

    let xpEarned = 0;
    let message: string;

    if (existingToday) {
      message = "Daily check-in updated! (Daily XP for today was already recorded).";
    } else {
      await awardUserXP(session.id, 25, "wellness_daily_checkin");
      xpEarned = 25;
      message = "Wellness check-in recorded! +25 XP awarded for mindful self-reflection 🌿";
    }

    revalidatePath("/wellness");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
    };
  } catch (error) {
    console.error("Failed to record wellness check-in:", error);
    return {
      success: false,
      error: "An unexpected error occurred while saving your check-in.",
    };
  }
}

/**
 * Server action to log a completed meditation session.
 * Awards +50 XP on first session completion of the day.
 */
export async function logMeditationSessionAction(data: {
  sessionType: string;
  title: string;
  durationMinutes: number;
  soundscape?: string;
  notes?: string;
}): Promise<WellnessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to log meditation sessions.",
    };
  }

  const sessionType = (data.sessionType || "mindfulness").trim().toLowerCase().slice(0, 30);
  const durationMinutes = Math.max(1, Math.min(180, Math.round(Number(data.durationMinutes) || 10)));
  const soundscape = data.soundscape ? data.soundscape.trim().slice(0, 50) : undefined;
  const notes = data.notes ? data.notes.trim().slice(0, 280) : undefined;

  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Rate limiting: check for rapid double-click submissions
    const recentSession = await prisma.meditationLog.findFirst({
      where: {
        userId: session.id,
        completedAt: { gte: twoMinutesAgo },
      },
    });

    if (recentSession) {
      return {
        success: false,
        error: "A meditation session was just recorded a moment ago. Please take a mindful breath!",
      };
    }

    // Check if this type of meditation was already completed today
    const alreadyCompletedToday = await prisma.meditationLog.findFirst({
      where: {
        userId: session.id,
        sessionType,
        completedAt: { gte: startOfToday },
      },
    });

    await prisma.meditationLog.create({
      data: {
        userId: session.id,
        sessionType,
        durationMinutes,
        soundscape,
        notes,
        completedAt: now,
      },
    });

    let xpEarned = 0;
    let message: string;

    if (alreadyCompletedToday) {
      message = `Meditation session logged in your mindfulness history! (Daily XP for ${sessionType} was already claimed today).`;
    } else {
      await awardUserXP(session.id, 50, "meditation_session");
      xpEarned = 50;
      message = `Meditation session completed! +50 XP awarded 🧘 Keep cultivating stillness!`;
    }

    revalidatePath("/meditation");
    revalidatePath("/wellness");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
    };
  } catch (error) {
    console.error("Failed to log meditation session:", error);
    return {
      success: false,
      error: "Failed to record meditation session to database.",
    };
  }
}

/**
 * Server action to log a completed breathing / relaxation exercise session.
 * Awards +30 XP on first breathing session of the day.
 */
export async function logBreathingSessionAction(data: {
  pattern: string;
  durationMinutes: number;
  cyclesCompleted?: number;
}): Promise<WellnessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to log breathwork sessions.",
    };
  }

  const pattern = (data.pattern || "box").trim().toLowerCase().slice(0, 30);
  const durationMinutes = Math.max(1, Math.min(60, Math.round(Number(data.durationMinutes) || 3)));
  const cycles = data.cyclesCompleted ? Math.max(1, Math.round(data.cyclesCompleted)) : 4;

  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const recent = await prisma.meditationLog.findFirst({
      where: {
        userId: session.id,
        sessionType: "breathing",
        completedAt: { gte: oneMinuteAgo },
      },
    });

    if (recent) {
      return {
        success: false,
        error: "A breathing session was just recorded. Allow a moment before starting another.",
      };
    }

    const alreadyCompletedToday = await prisma.meditationLog.findFirst({
      where: {
        userId: session.id,
        sessionType: "breathing",
        completedAt: { gte: startOfToday },
      },
    });

    await prisma.meditationLog.create({
      data: {
        userId: session.id,
        sessionType: "breathing",
        durationMinutes,
        notes: `Pattern: ${pattern} • Completed ${cycles} breath cycles`,
        completedAt: now,
      },
    });

    let xpEarned = 0;
    let message: string;

    if (alreadyCompletedToday) {
      message = "Breathing session saved to your wellness history! (Daily XP for breathing was already claimed).";
    } else {
      await awardUserXP(session.id, 30, "breathing_session");
      xpEarned = 30;
      message = "Guided breathing completed! +30 XP awarded 💨 Nervous system balanced!";
    }

    revalidatePath("/wellness");
    revalidatePath("/dashboard");

    return {
      success: true,
      message,
      xpEarned,
    };
  } catch (error) {
    console.error("Failed to log breathing session:", error);
    return {
      success: false,
      error: "Failed to record breathing session to database.",
    };
  }
}

/**
 * Server action to log Mudra practice progress.
 * Awards +30 XP on first mudra practice of the day.
 */
export async function logMudraPracticeAction(data: {
  mudraKey: string;
  durationMinutes: number;
}): Promise<WellnessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to log Mudra practice.",
    };
  }

  const mudraKey = (data.mudraKey || "gyan").trim().toLowerCase().slice(0, 30);
  const durationMinutes = Math.max(1, Math.min(120, Math.round(Number(data.durationMinutes) || 10)));

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check previous practice record
    const existing = await prisma.mudraProgress.findUnique({
      where: {
        userId_mudraKey: {
          userId: session.id,
          mudraKey,
        },
      },
    });

    const alreadyPracticedToday = existing && new Date(existing.lastPracticed) >= startOfToday;

    await prisma.mudraProgress.upsert({
      where: {
        userId_mudraKey: {
          userId: session.id,
          mudraKey,
        },
      },
      update: {
        practiceCount: { increment: 1 },
        totalMinutes: { increment: durationMinutes },
        lastPracticed: now,
      },
      create: {
        userId: session.id,
        mudraKey,
        practiceCount: 1,
        totalMinutes: durationMinutes,
        lastPracticed: now,
      },
    });

    let xpEarned = 0;
    let message: string;

    if (alreadyPracticedToday) {
      message = `Mudra practice recorded! (Daily XP for ${mudraKey} was already claimed today).`;
    } else {
      await awardUserXP(session.id, 30, "mudra_practice");
      xpEarned = 30;
      message = `Mudra practice completed! +30 XP awarded ✨ Mind and body grounded!`;
    }

    revalidatePath("/mudras");
    revalidatePath("/wellness");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
    };
  } catch (error) {
    console.error("Failed to log Mudra practice:", error);
    return {
      success: false,
      error: "Failed to record Mudra practice.",
    };
  }
}
