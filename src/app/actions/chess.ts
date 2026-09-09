"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  awardUserXP,
  checkAndAwardAchievements,
  recordActivityForChallenges,
} from "@/lib/gamification";

export interface ChessActionResult {
  success: boolean;
  message?: string;
  error?: string;
  xpEarned?: number;
  newElo?: number;
  unlockedAchievements?: string[];
}

/**
 * Server action to record a verified chess game played against AI.
 * Enforces server-side move count validation, anti-spam cooldown, and anti-farming daily caps.
 */
export async function recordChessGameAction(data: {
  difficulty: string;
  playerColor?: string;
  result: string;
  movesCount: number;
  pgn?: string;
  finalFen?: string;
}): Promise<ChessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to record chess games.",
    };
  }

  const difficulty = (data.difficulty || "medium").trim().toLowerCase().slice(0, 20);
  const playerColor = (data.playerColor || "white").trim().toLowerCase().slice(0, 10);
  const result = (data.result || "loss").trim().toLowerCase();
  const movesCount = Math.max(0, Math.round(Number(data.movesCount) || 0));

  if (!["win", "loss", "draw"].includes(result)) {
    return {
      success: false,
      error: "Invalid game result.",
    };
  }

  if (movesCount < 2) {
    return {
      success: false,
      error: "Game must contain at least 2 full moves to be verified.",
    };
  }

  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Cooldown check: prevent automated rapid spam
    const recentGame = await prisma.chessGame.findFirst({
      where: {
        userId: session.id,
        playedAt: { gte: oneMinuteAgo },
      },
    });

    if (recentGame) {
      return {
        success: false,
        error: "A chess match was recorded just a moment ago. Please take your time between matches.",
      };
    }

    // 2. Count today's rewarded chess games (anti-farming cap: max 5 rewarded games per day)
    const gamesTodayCount = await prisma.chessGame.count({
      where: {
        userId: session.id,
        playedAt: { gte: startOfToday },
      },
    });

    // 3. Update or initialize ChessStats
    const currentStats = await prisma.chessStats.findUnique({
      where: { userId: session.id },
    });

    const currentElo = currentStats?.eloRating ?? 1200;
    let eloChange = 0;

    if (result === "win") {
      eloChange = difficulty === "advanced" ? 25 : difficulty === "hard" ? 20 : difficulty === "medium" ? 15 : 10;
    } else if (result === "loss") {
      eloChange = -8;
    } else {
      eloChange = 4;
    }

    const newElo = Math.max(800, Math.min(2800, currentElo + eloChange));

    await prisma.chessStats.upsert({
      where: { userId: session.id },
      update: {
        eloRating: newElo,
        gamesPlayed: { increment: 1 },
        wins: result === "win" ? { increment: 1 } : undefined,
        losses: result === "loss" ? { increment: 1 } : undefined,
        draws: result === "draw" ? { increment: 1 } : undefined,
      },
      create: {
        userId: session.id,
        eloRating: newElo,
        gamesPlayed: 1,
        wins: result === "win" ? 1 : 0,
        losses: result === "loss" ? 1 : 0,
        draws: result === "draw" ? 1 : 0,
      },
    });

    // 4. Persist ChessGame record
    await prisma.chessGame.create({
      data: {
        userId: session.id,
        opponentType: "AI",
        difficulty,
        playerColor,
        result,
        movesCount,
        pgn: data.pgn ? data.pgn.slice(0, 5000) : undefined,
        finalFen: data.finalFen ? data.finalFen.slice(0, 200) : undefined,
        playedAt: now,
      },
    });

    // 5. Calculate XP reward
    let xpEarned = 0;
    let message = `Match recorded! Result: ${result.toUpperCase()}. ELO: ${newElo} (${eloChange >= 0 ? `+${eloChange}` : eloChange}).`;

    if (gamesTodayCount < 5) {
      if (result === "win") {
        xpEarned = 60;
      } else if (result === "draw") {
        xpEarned = 30;
      } else {
        xpEarned = 15; // Small participation XP for completion
      }

      await awardUserXP(
        session.id,
        xpEarned,
        "chess_match",
        `Chess Match (${difficulty.toUpperCase()} AI): ${result.toUpperCase()}`,
        { difficulty, result, movesCount }
      );

      message = `Match verified! +${xpEarned} XP awarded ♟️ New ELO: ${newElo} (${eloChange >= 0 ? `+${eloChange}` : eloChange})`;
    } else {
      message += " (Daily chess XP limit of 5 games reached for today).";
    }

    // 6. Record challenge progress for chess domain
    await recordActivityForChallenges(session.id, "chess", 1);

    // 7. Check for Tactical Checkmate achievement
    const unlockedAchievements = await checkAndAwardAchievements(session.id);

    revalidatePath("/chess");
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message,
      xpEarned,
      newElo,
      unlockedAchievements,
    };
  } catch (error) {
    console.error("Failed to record chess game:", error);
    return {
      success: false,
      error: "Failed to record chess game to database.",
    };
  }
}

/**
 * Server action to record a tactical puzzle drill completion.
 */
export async function recordPuzzleAttemptAction(data: {
  puzzleId?: string;
  isSolved: boolean;
  timeTakenSec?: number;
}): Promise<ChessActionResult> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to record puzzle attempts.",
    };
  }

  const isSolved = Boolean(data.isSolved);

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (isSolved) {
      // Update chess stats
      await prisma.chessStats.upsert({
        where: { userId: session.id },
        update: {
          puzzlesSolved: { increment: 1 },
          puzzleRating: { increment: 10 },
        },
        create: {
          userId: session.id,
          puzzlesSolved: 1,
          puzzleRating: 1210,
        },
      });

      // Check daily puzzle count
      const attemptsToday = await prisma.activityLog.count({
        where: {
          userId: session.id,
          activityType: "chess_puzzle",
          createdAt: { gte: startOfToday },
        },
      });

      let xpEarned = 0;
      let message = "Tactical puzzle solved!";

      if (attemptsToday < 3) {
        xpEarned = 40;
        await awardUserXP(
          session.id,
          40,
          "chess_puzzle",
          "Solved daily tactical checkmate puzzle",
          { puzzleId: data.puzzleId }
        );
        message = "Tactical puzzle solved! +40 XP awarded 🎯 Puzzle rating increased!";
      } else {
        message = "Puzzle solved! (Daily puzzle XP reward already claimed).";
      }

      await recordActivityForChallenges(session.id, "chess", 1);
      const unlockedAchievements = await checkAndAwardAchievements(session.id);

      revalidatePath("/chess");
      revalidatePath("/dashboard");
      revalidatePath("/profile");

      return {
        success: true,
        message,
        xpEarned,
        unlockedAchievements,
      };
    }

    return {
      success: true,
      message: "Puzzle attempt recorded. Keep analyzing the board!",
      xpEarned: 0,
    };
  } catch (error) {
    console.error("Failed to record puzzle attempt:", error);
    return {
      success: false,
      error: "Failed to record puzzle attempt.",
    };
  }
}
