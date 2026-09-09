"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  awardUserXP,
  getLevelProgress,
  getEffectiveStreak,
  seedChallengesIfEmpty,
  checkAndAwardAchievements,
} from "@/lib/gamification";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: string;
  score: string;
  streak: string;
  badge: string;
  isCurrentUser?: boolean;
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  type: string;
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  timeLeft: string;
  isCompleted: boolean;
  canClaim: boolean;
}

/**
 * Server action to fetch challenges with live user progress.
 */
export async function getChallengesAction(): Promise<{
  success: boolean;
  challenges: ChallengeItem[];
  error?: string;
}> {
  try {
    let session = null;
    try {
      session = await getSession();
    } catch {
      // outside request scope fallback
    }
    await seedChallengesIfEmpty();

    const now = new Date();
    const activeChallenges = await prisma.challenge.findMany({
      where: { endDate: { gte: now } },
      orderBy: [{ type: "asc" }, { xpReward: "asc" }],
      include: {
        userProgress: {
          where: { userId: session?.id || "unauthenticated" },
        },
      },
    });

    const items: ChallengeItem[] = activeChallenges.map((ch) => {
      const progress = ch.userProgress?.[0];
      const currentCount = progress?.currentCount ?? 0;
      const isCompleted = progress?.isCompleted ?? false;
      const canClaim = !isCompleted && currentCount >= ch.targetCount;

      const msRemaining = Math.max(0, new Date(ch.endDate).getTime() - now.getTime());
      const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
      const daysRemaining = Math.floor(hoursRemaining / 24);

      let timeLeft = "Ending soon";
      if (isCompleted) {
        timeLeft = "Completed";
      } else if (daysRemaining > 0) {
        timeLeft = `${daysRemaining}d left`;
      } else if (hoursRemaining > 0) {
        timeLeft = `${hoursRemaining}h left`;
      }

      let unit = "reps";
      if (ch.domain === "hydration") unit = "goals";
      else if (ch.domain === "fitness") unit = "sessions";
      else if (ch.domain === "wellness") unit = "sessions";
      else if (ch.domain === "chess") unit = "matches";
      else if (ch.domain === "cognitive") unit = "games";

      return {
        id: ch.id,
        title: ch.title,
        description: ch.description,
        category:
          ch.domain.charAt(0).toUpperCase() + ch.domain.slice(1) +
          (ch.type === "weekly" ? " (Weekly)" : " (Daily)"),
        domain: ch.domain,
        type: ch.type,
        xpReward: ch.xpReward,
        currentProgress: currentCount,
        targetProgress: ch.targetCount,
        unit,
        timeLeft,
        isCompleted,
        canClaim,
      };
    });

    return {
      success: true,
      challenges: items,
    };
  } catch (error) {
    console.error("Failed to load challenges:", error);
    return {
      success: false,
      challenges: [],
      error: "Failed to fetch active challenges.",
    };
  }
}

/**
 * Server action to manually claim a completed challenge reward if not already auto-claimed.
 */
export async function claimChallengeRewardAction(challengeId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  xpEarned?: number;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be logged in to claim challenge rewards.",
    };
  }

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return {
        success: false,
        error: "Challenge not found.",
      };
    }

    const progress = await prisma.userChallengeProgress.findUnique({
      where: {
        userId_challengeId: {
          userId: session.id,
          challengeId,
        },
      },
    });

    if (!progress || progress.currentCount < challenge.targetCount) {
      return {
        success: false,
        error: "Challenge requirements have not been completed yet.",
      };
    }

    if (progress.isCompleted) {
      return {
        success: false,
        error: "This challenge reward has already been claimed.",
      };
    }

    // Mark completed
    await prisma.userChallengeProgress.update({
      where: {
        userId_challengeId: {
          userId: session.id,
          challengeId,
        },
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Award XP
    await awardUserXP(
      session.id,
      challenge.xpReward,
      "challenge_claim",
      `Claimed reward for challenge: ${challenge.title}`,
      { challengeId: challenge.id }
    );

    await checkAndAwardAchievements(session.id);

    revalidatePath("/challenges");
    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      message: `Quest completed! +${challenge.xpReward} XP awarded 🔥`,
      xpEarned: challenge.xpReward,
    };
  } catch (error) {
    console.error("Failed to claim challenge reward:", error);
    return {
      success: false,
      error: "An unexpected error occurred while claiming your reward.",
    };
  }
}

/**
 * Server action to fetch public leaderboard rankings across disciplines.
 * Strictly sanitizes data to never expose email, password, or private user data.
 */
export async function getLeaderboardAction(tab: string = "overall"): Promise<{
  success: boolean;
  rankings: LeaderboardEntry[];
  topThree: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
  error?: string;
}> {
  try {
    let session = null;
    try {
      session = await getSession();
    } catch {
      // outside request scope fallback
    }

    let usersQuery;

    if (tab === "weekly") {
      usersQuery = await prisma.user.findMany({
        where: {
          gamification: {
            weeklyXP: { gt: 0 },
          },
        },
        include: {
          gamification: true,
          chessStats: true,
        },
        orderBy: {
          gamification: {
            weeklyXP: "desc",
          },
        },
        take: 50,
      });
    } else if (tab === "chess") {
      usersQuery = await prisma.user.findMany({
        where: {
          chessStats: { isNot: null },
        },
        include: {
          gamification: true,
          chessStats: true,
        },
        orderBy: {
          chessStats: {
            eloRating: "desc",
          },
        },
        take: 50,
      });
    } else if (tab === "fitness") {
      usersQuery = await prisma.user.findMany({
        include: {
          gamification: true,
          workoutSessions: true,
          chessStats: true,
        },
        take: 50,
      });

      // Sort by workout count & total workout minutes
      usersQuery.sort((a, b) => {
        const aMin = a.workoutSessions.reduce((s, w) => s + w.durationMinutes, 0);
        const bMin = b.workoutSessions.reduce((s, w) => s + w.durationMinutes, 0);
        return bMin - aMin;
      });
    } else {
      // Overall XP
      usersQuery = await prisma.user.findMany({
        include: {
          gamification: true,
          chessStats: true,
        },
        orderBy: {
          gamification: {
            totalXP: "desc",
          },
        },
        take: 50,
      });
    }

    // Transform into clean public LeaderboardEntry
    const entries: LeaderboardEntry[] = usersQuery.map((u, idx) => {
      const g = u.gamification;
      const streakInfo = getEffectiveStreak(g);
      const isCurrentUser = session?.id === u.id;

      let score = `${(g?.totalXP ?? 0).toLocaleString()} XP`;
      let badge = "Athlete";

      if (tab === "weekly") {
        score = `${(g?.weeklyXP ?? 0).toLocaleString()} XP`;
        badge = "Sprinter";
      } else if (tab === "chess") {
        score = `${(u.chessStats?.eloRating ?? 1200)} ELO`;
        badge = (u.chessStats?.eloRating ?? 1200) >= 1600 ? "Grandmaster" : "Tactician";
      } else if (tab === "fitness") {
        const totalMinutes = ("workoutSessions" in u ? (u.workoutSessions as Array<{ durationMinutes: number }>).reduce((s, w) => s + w.durationMinutes, 0) : 0);
        score = `${totalMinutes} Mins`;
        badge = totalMinutes >= 120 ? "Iron Core" : "Cardio Active";
      } else {
        if ((g?.totalXP ?? 0) >= 2000) badge = "Zen Master";
        else if ((g?.totalXP ?? 0) >= 1000) badge = "Dedicated";
      }

      return {
        rank: idx + 1,
        username: u.username,
        level: `Lvl ${g?.currentLevel ?? 1}`,
        score,
        streak: `${streakInfo.currentStreak} Day${streakInfo.currentStreak === 1 ? "" : "s"}`,
        badge,
        isCurrentUser,
      };
    });

    const topThree = entries.slice(0, 3);
    const remaining = entries.slice(3);

    // Current user ranking
    let currentUserRank: LeaderboardEntry | null = null;
    const foundUser = entries.find((e) => e.isCurrentUser);

    if (foundUser) {
      currentUserRank = foundUser;
    } else if (session?.id) {
      // User is outside top 50, compute their rank
      const currentUserData = await prisma.user.findUnique({
        where: { id: session.id },
        include: { gamification: true, chessStats: true },
      });

      if (currentUserData) {
        const userXP = currentUserData.gamification?.totalXP ?? 0;
        const higherCount = await prisma.gamificationProfile.count({
          where: { totalXP: { gt: userXP } },
        });

        const streakInfo = getEffectiveStreak(currentUserData.gamification);

        currentUserRank = {
          rank: higherCount + 1,
          username: currentUserData.username,
          level: `Lvl ${currentUserData.gamification?.currentLevel ?? 1}`,
          score: `${userXP.toLocaleString()} XP`,
          streak: `${streakInfo.currentStreak} Days`,
          badge: "Rising Contender",
          isCurrentUser: true,
        };
      }
    }

    return {
      success: true,
      rankings: remaining,
      topThree,
      currentUserRank,
    };
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return {
      success: false,
      rankings: [],
      topThree: [],
      currentUserRank: null,
      error: "Failed to load leaderboard.",
    };
  }
}

/**
 * Server action to get authenticated user's gamification details.
 */
export async function getUserGamificationDataAction() {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        gamification: true,
        chessStats: true,
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        userAchievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const gamification = user.gamification;
    const levelInfo = getLevelProgress(gamification?.totalXP ?? 0);
    const streakInfo = getEffectiveStreak(gamification);

    return {
      success: true,
      levelInfo,
      streakInfo,
      activityLogs: user.activityLogs,
      achievements: user.userAchievements.map((ua) => ({
        id: ua.achievement.id,
        code: ua.achievement.code,
        title: ua.achievement.title,
        description: ua.achievement.description,
        category: ua.achievement.category,
        xpReward: ua.achievement.xpReward,
        iconKey: ua.achievement.iconKey,
        unlockedAt: ua.unlockedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to load user gamification data:", error);
    return { success: false, error: "Failed to load profile gamification." };
  }
}
