import prisma from "@/lib/prisma";

/**
 * Standard progression formula:
 * Total XP required for Level N = 100 * N^1.5
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
 * Calculates the XP threshold of the current level floor.
 */
export function getCurrentLevelFloorXP(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return Math.round(100 * Math.pow(currentLevel, 1.5));
}

/**
 * Comprehensive level progress calculation for UI bars.
 */
export function getLevelProgress(totalXP: number) {
  const currentLevel = calculateLevelFromXP(totalXP);
  const floorXP = getCurrentLevelFloorXP(currentLevel);
  const nextXP = getNextLevelXP(currentLevel);
  const range = Math.max(1, nextXP - floorXP);
  const progressInLevel = Math.max(0, totalXP - floorXP);
  const progressPercentage = Math.min(100, Math.round((progressInLevel / range) * 100));

  return {
    currentLevel,
    totalXP,
    floorXP,
    nextXP,
    progressPercentage,
    xpToNext: Math.max(0, nextXP - totalXP),
  };
}

/**
 * Accurately determines the effective streak state:
 * - Active today: user has performed an activity today.
 * - Active yesterday: streak intact, user can continue today.
 * - Lapsed: 2+ days without activity, streak has reset to 0 until activity logged today.
 */
export function getEffectiveStreak(
  profile: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date | null;
  } | null
): {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
} {
  if (!profile || !profile.lastActiveDate) {
    return {
      currentStreak: 0,
      longestStreak: profile?.longestStreak ?? 0,
      isActiveToday: false,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = new Date(profile.lastActiveDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      isActiveToday: true,
    };
  } else if (diffDays === 1) {
    return {
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      isActiveToday: false,
    };
  } else {
    return {
      currentStreak: 0,
      longestStreak: profile.longestStreak,
      isActiveToday: false,
    };
  }
}

/**
 * Authoritative server-side XP awarding function:
 * - Validates XP bounds (never negative, bounded to max 1000 per event).
 * - Computes calendar day streak idempotently.
 * - Recalculates level server-side.
 * - Logs an entry in ActivityLog for audit history.
 * - Updates GamificationProfile.
 */
export async function awardUserXP(
  userId: string,
  xpAmount: number,
  source: string = "activity",
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  leveledUp: boolean;
}> {
  if (!userId || typeof xpAmount !== "number" || isNaN(xpAmount) || xpAmount <= 0) {
    throw new Error("Invalid XP award parameters");
  }

  const safeAmount = Math.min(1000, Math.round(xpAmount));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await prisma.gamificationProfile.findUnique({
    where: { userId },
  });

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
    // If diffDays === 0, keep currentStreak (same-day activity maintains streak)
  } else {
    currentStreak = 1;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  const oldXP = existing?.totalXP ?? 0;
  const newXP = oldXP + safeAmount;
  const oldLevel = existing?.currentLevel ?? 1;
  const newLevel = calculateLevelFromXP(newXP);
  const leveledUp = newLevel > oldLevel;

  // Persist gamification profile
  const profile = await prisma.gamificationProfile.upsert({
    where: { userId },
    update: {
      totalXP: newXP,
      weeklyXP: (existing?.weeklyXP ?? 0) + safeAmount,
      currentLevel: newLevel,
      currentStreak,
      longestStreak,
      lastActiveDate: now,
    },
    create: {
      userId,
      totalXP: newXP,
      weeklyXP: safeAmount,
      currentLevel: newLevel,
      currentStreak,
      longestStreak,
      lastActiveDate: now,
    },
  });

  // Log in ActivityLog
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        activityType: source,
        xpEarned: safeAmount,
        description: description || `Completed ${source.replace(/_/g, " ")}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Failed to write ActivityLog:", error);
  }

  return {
    totalXP: profile.totalXP,
    currentLevel: profile.currentLevel,
    currentStreak: profile.currentStreak,
    leveledUp,
  };
}

/**
 * Standard System Achievements
 */
export const STANDARD_ACHIEVEMENTS = [
  {
    code: "FIRST_WORKOUT",
    title: "First Step Forward",
    description: "Completed your first logged workout session on SmartFit.",
    category: "physical",
    xpReward: 50,
    iconKey: "dumbbell",
  },
  {
    code: "FIRST_MEDITATION",
    title: "Inner Stillness",
    description: "Completed your first guided mindfulness or breathwork session.",
    category: "mental",
    xpReward: 50,
    iconKey: "sparkles",
  },
  {
    code: "FIRST_WELLNESS",
    title: "Mindful Self-Care",
    description: "Recorded your first daily wellness mood & stress check-in.",
    category: "mental",
    xpReward: 40,
    iconKey: "heart",
  },
  {
    code: "STREAK_7_DAY",
    title: "7-Day Iron Streak",
    description: "Maintained active daily physical or mental workouts for 7 consecutive days.",
    category: "consistency",
    xpReward: 100,
    iconKey: "flame",
  },
  {
    code: "CHESS_VICTORY",
    title: "Tactical Checkmate",
    description: "Delivered checkmate in a match against Stockfish AI.",
    category: "chess",
    xpReward: 80,
    iconKey: "brain",
  },
  {
    code: "COGNITIVE_CHAMP",
    title: "Mental Agility",
    description: "Achieved a high performance score in cognitive mini-games.",
    category: "chess",
    xpReward: 60,
    iconKey: "zap",
  },
  {
    code: "HYDRATION_HERO",
    title: "Hydration Hero",
    description: "Reached 100% of your daily water intake goal.",
    category: "physical",
    xpReward: 50,
    iconKey: "droplet",
  },
  {
    code: "CHALLENGE_CONQUEROR",
    title: "Quest Master",
    description: "Successfully conquered a daily or weekly SmartFit quest.",
    category: "consistency",
    xpReward: 100,
    iconKey: "trophy",
  },
];

/**
 * Checks eligibility and awards all qualifying achievements idempotently.
 * Returns an array of newly unlocked achievement titles.
 */
export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const newlyUnlocked: string[] = [];

  try {
    // 1. Fetch user milestones
    const [
      workoutCount,
      meditationCount,
      wellnessCount,
      chessStats,
      brainCount,
      gamification,
      challengeCompletedCount,
    ] = await Promise.all([
      prisma.workoutSession.count({ where: { userId } }),
      prisma.meditationLog.count({ where: { userId } }),
      prisma.wellnessCheckIn.count({ where: { userId } }),
      prisma.chessStats.findUnique({ where: { userId } }),
      prisma.brainGameAttempt.count({ where: { userId } }),
      prisma.gamificationProfile.findUnique({ where: { userId } }),
      prisma.userChallengeProgress.count({ where: { userId, isCompleted: true } }),
    ]);

    const eligibilityMap: Record<string, boolean> = {
      FIRST_WORKOUT: workoutCount > 0,
      FIRST_MEDITATION: meditationCount > 0,
      FIRST_WELLNESS: wellnessCount > 0,
      STREAK_7_DAY: (gamification?.currentStreak ?? 0) >= 7,
      CHESS_VICTORY: (chessStats?.wins ?? 0) > 0,
      COGNITIVE_CHAMP: brainCount > 0,
      HYDRATION_HERO: false, // Updated on hydration completion
      CHALLENGE_CONQUEROR: challengeCompletedCount > 0,
    };

    // 2. Fetch existing user achievements
    const existingAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const existingCodes = new Set(existingAchievements.map((ua) => ua.achievement.code));

    // 3. Evaluate each standard achievement
    for (const def of STANDARD_ACHIEVEMENTS) {
      if (!existingCodes.has(def.code) && eligibilityMap[def.code]) {
        // Ensure base Achievement record exists
        const ach = await prisma.achievement.upsert({
          where: { code: def.code },
          update: {},
          create: {
            code: def.code,
            title: def.title,
            description: def.description,
            category: def.category,
            xpReward: def.xpReward,
            iconKey: def.iconKey,
          },
        });

        // Award to user
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: ach.id,
          },
        });

        await awardUserXP(
          userId,
          def.xpReward,
          "achievement_unlock",
          `Unlocked Achievement: ${def.title}`,
          { code: def.code }
        );

        newlyUnlocked.push(def.title);
      }
    }
  } catch (error) {
    console.error("Error evaluating achievements:", error);
  }

  return newlyUnlocked;
}

/**
 * Backward-compatible helper for workout achievements.
 */
export async function checkAndAwardWorkoutAchievements(userId: string): Promise<string | null> {
  const unlocked = await checkAndAwardAchievements(userId);
  const workoutAch = unlocked.find((t) => t === "First Step Forward");
  return workoutAch || null;
}

/**
 * Standard System Challenges Definitions
 */
export const DEFAULT_CHALLENGES = [
  {
    title: "Mindful Hydration Quota",
    category: "Hydration",
    domain: "hydration",
    type: "daily",
    description: "Drink and log your daily water goal (2,000ml+) on SmartFit.",
    targetCount: 1,
    xpReward: 30,
    durationDays: 1,
  },
  {
    title: "Core Power 20-Min Workout",
    category: "Fitness Routine",
    domain: "fitness",
    type: "daily",
    description: "Complete a personalized workout session in the Fitness Engine.",
    targetCount: 1,
    xpReward: 100,
    durationDays: 1,
  },
  {
    title: "Daily Morning Centering",
    category: "Meditation",
    domain: "wellness",
    type: "daily",
    description: "Complete a mindfulness, breathwork, or mudra session today.",
    targetCount: 1,
    xpReward: 50,
    durationDays: 1,
  },
  {
    title: "Tactical Chess Victory",
    category: "Chess Match",
    domain: "chess",
    type: "daily",
    description: "Win or play a verified match against Stockfish AI in the Chess Arena.",
    targetCount: 1,
    xpReward: 60,
    durationDays: 1,
  },
  {
    title: "Cognitive Focus Drill",
    category: "Brain Agility",
    domain: "cognitive",
    type: "daily",
    description: "Complete at least 2 cognitive agility mini-game sessions.",
    targetCount: 2,
    xpReward: 50,
    durationDays: 1,
  },
  {
    title: "7-Day Weekly Cross-Training",
    category: "Weekly Quest",
    domain: "fitness",
    type: "weekly",
    description: "Log at least 3 workouts and 2 meditation sessions this week.",
    targetCount: 5,
    xpReward: 250,
    durationDays: 7,
  },
];

/**
 * Automatically seeds default challenges if none exist or if current challenges have expired.
 */
export async function seedChallengesIfEmpty(): Promise<void> {
  try {
    const now = new Date();
    const activeCount = await prisma.challenge.count({
      where: { endDate: { gte: now } },
    });

    if (activeCount >= 4) return;

    for (const def of DEFAULT_CHALLENGES) {
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = new Date(startDate.getTime() + def.durationDays * 24 * 60 * 60 * 1000 - 1000);

      // Check if this challenge is already active
      const existing = await prisma.challenge.findFirst({
        where: {
          title: def.title,
          endDate: { gte: now },
        },
      });

      if (!existing) {
        await prisma.challenge.create({
          data: {
            title: def.title,
            description: def.description,
            domain: def.domain,
            type: def.type,
            targetCount: def.targetCount,
            xpReward: def.xpReward,
            startDate,
            endDate,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error seeding challenges:", error);
  }
}

/**
 * Advances challenge progress for a specific domain when an activity completes.
 * Automatically completes the challenge and awards XP if target is reached.
 */
export async function recordActivityForChallenges(
  userId: string,
  domain: string,
  increment: number = 1
): Promise<{ completedChallenges: string[] }> {
  const completedChallenges: string[] = [];

  try {
    await seedChallengesIfEmpty();
    const now = new Date();

    const activeChallenges = await prisma.challenge.findMany({
      where: {
        domain,
        endDate: { gte: now },
      },
    });

    for (const ch of activeChallenges) {
      const userProgress = await prisma.userChallengeProgress.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId: ch.id,
          },
        },
      });

      if (userProgress?.isCompleted) {
        continue;
      }

      const currentCount = (userProgress?.currentCount ?? 0) + increment;
      const willComplete = currentCount >= ch.targetCount;

      await prisma.userChallengeProgress.upsert({
        where: {
          userId_challengeId: {
            userId,
            challengeId: ch.id,
          },
        },
        update: {
          currentCount,
          isCompleted: willComplete,
          completedAt: willComplete ? now : null,
        },
        create: {
          userId,
          challengeId: ch.id,
          currentCount,
          isCompleted: willComplete,
          completedAt: willComplete ? now : null,
        },
      });

      if (willComplete) {
        // Award challenge reward
        await awardUserXP(
          userId,
          ch.xpReward,
          "challenge_completed",
          `Completed Challenge: ${ch.title}`,
          { challengeId: ch.id, type: ch.type }
        );
        completedChallenges.push(ch.title);

        // Check for Challenge Conqueror achievement
        await checkAndAwardAchievements(userId);
      }
    }
  } catch (error) {
    console.error("Error updating challenge progress:", error);
  }

  return { completedChallenges };
}
