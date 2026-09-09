import prisma from "@/lib/prisma";

/**
 * Calculates current level from total XP based on SmartFit progression formula:
 * XP required for Level N = 100 * N^1.5
 */
export function calculateLevelFromXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  let level = 1;
  while (100 * Math.pow(level + 1, 1.5) <= totalXP) {
    level++;
  }
  return level;
}

/**
 * Calculates the XP threshold required to reach the next level.
 */
export function getNextLevelXP(currentLevel: number): number {
  return Math.round(100 * Math.pow(currentLevel + 1, 1.5));
}

/**
 * Awards XP to a user, updates level, computes streak, and saves to database.
 */
export async function awardUserXP(
  userId: string,
  xpAmount: number,
  _source?: string
): Promise<{ totalXP: number; currentLevel: number; currentStreak: number; leveledUp: boolean }> {
  const existing = await prisma.gamificationProfile.findUnique({
    where: { userId },
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let currentStreak = existing?.currentStreak ?? 0;
  let longestStreak = existing?.longestStreak ?? 0;

  if (existing?.lastActiveDate) {
    const last = new Date(existing.lastActiveDate);
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  const oldXP = existing?.totalXP ?? 0;
  const newXP = oldXP + xpAmount;
  const oldLevel = existing?.currentLevel ?? 1;
  const newLevel = calculateLevelFromXP(newXP);
  const leveledUp = newLevel > oldLevel;

  const profile = await prisma.gamificationProfile.upsert({
    where: { userId },
    update: {
      totalXP: newXP,
      weeklyXP: (existing?.weeklyXP ?? 0) + xpAmount,
      currentLevel: newLevel,
      currentStreak,
      longestStreak,
      lastActiveDate: now,
    },
    create: {
      userId,
      totalXP: newXP,
      weeklyXP: xpAmount,
      currentLevel: newLevel,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: now,
    },
  });

  return {
    totalXP: profile.totalXP,
    currentLevel: profile.currentLevel,
    currentStreak: profile.currentStreak,
    leveledUp,
  };
}

/**
 * Checks and awards initial achievements like First Step Forward upon completing workouts.
 */
export async function checkAndAwardWorkoutAchievements(userId: string): Promise<string | null> {
  try {
    const achievement = await prisma.achievement.upsert({
      where: { code: "FIRST_WORKOUT" },
      update: {},
      create: {
        code: "FIRST_WORKOUT",
        title: "First Step Forward",
        description: "Completed your first logged workout session on SmartFit.",
        category: "physical",
        xpReward: 50,
        iconKey: "dumbbell",
      },
    });

    const alreadyAwarded = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!alreadyAwarded) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      await awardUserXP(userId, achievement.xpReward, "achievement_first_workout");
      return achievement.title;
    }

    return null;
  } catch (error) {
    console.error("Error checking workout achievements:", error);
    return null;
  }
}
