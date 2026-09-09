"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  awardUserXP,
  checkAndAwardAchievements,
  recordActivityForChallenges,
} from "@/lib/gamification";

export interface CognitiveActionResult {
  success: boolean;
  message?: string;
  error?: string;
  xpEarned?: number;
  unlockedAchievements?: string[];
  highScore?: number;
}

/**
 * Server action to record completed cognitive mini-game results.
 * Validates scores server-side and applies anti-farming limits.
 */
export async function recordCognitiveAttemptAction(data: {
  gameType: string;
  score: number;
  levelReached?: number;
}): Promise<CognitiveActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to record cognitive game scores.",
    };
  }

  const validGameTypes = ["memory_matrix", "stroop_test", "speed_math"];
  const gameType = (data.gameType || "").trim().toLowerCase();

  if (!validGameTypes.includes(gameType)) {
    return {
      success: false,
      error: "Invalid cognitive game type.",
    };
  }

  // Bounds checking to prevent client manipulation
  const score = Math.max(0, Math.min(5000, Math.round(Number(data.score) || 0)));
  const levelReached = Math.max(1, Math.min(50, Math.round(Number(data.levelReached) || 1)));

  try {
    const now = new Date();
    const twentySecondsAgo = new Date(now.getTime() - 20 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Anti-spam cooldown
    const recent = await prisma.brainGameAttempt.findFirst({
      where: {
        userId: session.id,
        gameType,
        playedAt: { gte: twentySecondsAgo },
      },
    });

    if (recent) {
      return {
        success: false,
        error: "Session just completed. Please take a moment before your next drill.",
      };
    }

    // 2. Persist attempt
    await prisma.brainGameAttempt.create({
      data: {
        userId: session.id,
        gameType,
        score,
        levelReached,
        playedAt: now,
      },
    });

    // 3. Check personal high score
    const bestAttempt = await prisma.brainGameAttempt.findFirst({
      where: {
        userId: session.id,
        gameType,
      },
      orderBy: { score: "desc" },
    });

    // 4. Check today's rewarded attempts for this game (cap: 4 per game type per day)
    const todayAttemptsCount = await prisma.activityLog.count({
      where: {
        userId: session.id,
        activityType: "cognitive_drill",
        createdAt: { gte: startOfToday },
      },
    });

    let xpEarned = 0;
    let baseXP = 35;
    if (gameType === "memory_matrix" || gameType === "stroop_test") baseXP = 40;

    let message = `Drill completed! Score: ${score}.`;

    if (todayAttemptsCount < 4) {
      xpEarned = baseXP;
      await awardUserXP(
        session.id,
        xpEarned,
        "cognitive_drill",
        `Cognitive Drill (${gameType.replace(/_/g, " ")}): Score ${score}`,
        { gameType, score, levelReached }
      );
      message = `Cognitive drill completed! +${xpEarned} XP awarded 🧠 Working memory strengthened!`;
    } else {
      message += " (Daily cognitive drill XP limit reached for today).";
    }

    // 5. Update cognitive challenges
    await recordActivityForChallenges(session.id, "cognitive", 1);

    // 6. Check for Mental Agility achievement
    const unlockedAchievements = await checkAndAwardAchievements(session.id);

    revalidatePath("/cognitive");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
      unlockedAchievements,
      highScore: bestAttempt?.score ?? score,
    };
  } catch (error) {
    console.error("Failed to record cognitive attempt:", error);
    return {
      success: false,
      error: "Failed to record cognitive drill result.",
    };
  }
}
