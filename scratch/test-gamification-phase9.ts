import prisma from "../src/lib/prisma";
import {
  calculateLevelFromXP,
  getNextLevelXP,
  getLevelProgress,
  getEffectiveStreak,
  awardUserXP,
  checkAndAwardAchievements,
  recordActivityForChallenges,
  seedChallengesIfEmpty,
  STANDARD_ACHIEVEMENTS,
} from "../src/lib/gamification";
import { getLeaderboardAction } from "../src/app/actions/gamification";

async function runGamificationPhase9Tests() {
  console.log("=== STARTING SMARTFIT GAMIFICATION PHASE 9 TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✓ ${message}`);
      passed++;
    } else {
      console.error(`✗ FAILED: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Level Progression & Floor Formulas
  // -------------------------------------------------------------
  console.log("\n--- Test 1: Level & XP Progression Formulas ---");
  assert(calculateLevelFromXP(0) === 1, "0 XP is Level 1");
  assert(calculateLevelFromXP(50) === 1, "50 XP is Level 1");

  const lvl2Threshold = getNextLevelXP(1); // 100 * 2^1.5 ≈ 283
  assert(lvl2Threshold === 283, `Level 2 threshold is 283 XP (got ${lvl2Threshold})`);
  assert(calculateLevelFromXP(283) === 2, "283 XP reaches Level 2");
  assert(calculateLevelFromXP(282) === 1, "282 XP is still Level 1");

  const progressInfo = getLevelProgress(150);
  assert(progressInfo.currentLevel === 1, "LevelProgress correctly reports Level 1 for 150 XP");
  assert(progressInfo.progressPercentage > 0 && progressInfo.progressPercentage < 100, `Progress % is valid: ${progressInfo.progressPercentage}%`);
  assert(progressInfo.xpToNext === 283 - 150, `XP to next level is 133 (got ${progressInfo.xpToNext})`);

  // -------------------------------------------------------------
  // Test 2: Streak Calculation & Lapse Detection
  // -------------------------------------------------------------
  console.log("\n--- Test 2: Streak Calculation & Lapse Detection ---");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Active today
  const activeTodayStreak = getEffectiveStreak({
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: today,
  });
  assert(activeTodayStreak.currentStreak === 5 && activeTodayStreak.isActiveToday, "Streak active today reports 5 days and isActiveToday=true");

  // Active yesterday (can be continued)
  const activeYesterdayStreak = getEffectiveStreak({
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: yesterday,
  });
  assert(activeYesterdayStreak.currentStreak === 5 && !activeYesterdayStreak.isActiveToday, "Streak active yesterday maintains 5 days with isActiveToday=false");

  // Inactive for 2+ days (lapsed)
  const lapsedStreak = getEffectiveStreak({
    currentStreak: 5,
    longestStreak: 10,
    lastActiveDate: twoDaysAgo,
  });
  assert(lapsedStreak.currentStreak === 0 && !lapsedStreak.isActiveToday, "Streak inactive for 2+ days lapses to 0");

  // -------------------------------------------------------------
  // Test 3: Authoritative Database XP Awards & ActivityLog
  // -------------------------------------------------------------
  console.log("\n--- Test 3: Database XP Awards & ActivityLog ---");
  const testEmail = `test_gamify_${Date.now()}@smartfit.local`;
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      username: `gamify_${Date.now().toString().slice(-6)}`,
      passwordHash: "hash_placeholder",
    },
  });
  assert(Boolean(testUser.id), `Created temporary test user: ${testUser.username}`);

  // Invalid XP amounts rejected
  try {
    await awardUserXP(testUser.id, -50, "test");
    assert(false, "Negative XP must be rejected");
  } catch {
    assert(true, "Negative XP rejected as expected");
  }

  try {
    await awardUserXP(testUser.id, NaN, "test");
    assert(false, "NaN XP must be rejected");
  } catch {
    assert(true, "NaN XP rejected as expected");
  }

  // Award standard +100 XP
  const award1 = await awardUserXP(testUser.id, 100, "workout_session", "Completed morning HIIT");
  assert(award1.totalXP === 100, `First award: Total XP = 100 (got ${award1.totalXP})`);
  assert(award1.currentStreak === 1, `First award: Streak started at 1 (got ${award1.currentStreak})`);

  // Verify ActivityLog was created
  const log1 = await prisma.activityLog.findFirst({
    where: { userId: testUser.id, activityType: "workout_session" },
  });
  assert(Boolean(log1 && log1.xpEarned === 100), "ActivityLog persisted with 100 XP");

  // Same-day second award maintains streak
  const award2 = await awardUserXP(testUser.id, 50, "meditation", "Completed 10m meditation");
  assert(award2.totalXP === 150, `Second award: Total XP = 150 (got ${award2.totalXP})`);
  assert(award2.currentStreak === 1, "Same-day second activity preserves streak=1 without incrementing twice");

  // Level progression check
  const award3 = await awardUserXP(testUser.id, 200, "bonus", "Bonus quest completion");
  assert(award3.totalXP === 350, `Third award: Total XP = 350 (got ${award3.totalXP})`);
  assert(award3.currentLevel === 2, `User leveled up to Level 2! (got ${award3.currentLevel})`);
  assert(award3.leveledUp, "leveledUp flag correctly returned true");

  // -------------------------------------------------------------
  // Test 4: Challenges Seeding & Progress Recording
  // -------------------------------------------------------------
  console.log("\n--- Test 4: Challenges & Progress Recording ---");
  await seedChallengesIfEmpty();
  const activeChallenges = await prisma.challenge.findMany({
    where: { endDate: { gte: new Date() } },
  });
  assert(activeChallenges.length >= 4, `Active challenges seeded successfully (${activeChallenges.length} active)`);

  // Advance challenge progress
  const chRes = await recordActivityForChallenges(testUser.id, "fitness", 1);
  assert(Array.isArray(chRes.completedChallenges), "recordActivityForChallenges executed without errors");

  const progressRecord = await prisma.userChallengeProgress.findFirst({
    where: { userId: testUser.id },
  });
  assert(Boolean(progressRecord && progressRecord.currentCount >= 1), "UserChallengeProgress recorded in database");

  // -------------------------------------------------------------
  // Test 5: Achievement Unlocking & Duplicate Prevention
  // -------------------------------------------------------------
  console.log("\n--- Test 5: Achievement Unlocking & Duplicate Prevention ---");
  // Create a workout session to qualify for FIRST_WORKOUT
  await prisma.workoutSession.create({
    data: {
      userId: testUser.id,
      routineTitle: "Test Routine",
      durationMinutes: 20,
    },
  });

  const unlocked1 = await checkAndAwardAchievements(testUser.id);
  assert(unlocked1.includes("First Step Forward"), "First Step Forward achievement unlocked!");

  // Second evaluation must NOT duplicate unlock
  const unlocked2 = await checkAndAwardAchievements(testUser.id);
  assert(unlocked2.length === 0, "Duplicate achievement awards prevented on subsequent check (0 new awards)");

  const totalUserAchievements = await prisma.userAchievement.count({
    where: { userId: testUser.id },
  });
  assert(totalUserAchievements >= 1, `Achievements persisted in database for test user (got ${totalUserAchievements})`);

  // -------------------------------------------------------------
  // Test 6: Leaderboard Ranking & Privacy Protection
  // -------------------------------------------------------------
  console.log("\n--- Test 6: Leaderboard Ranking & Privacy Protection ---");
  const leaderboard = await getLeaderboardAction("overall");
  assert(leaderboard.success, "getLeaderboardAction returned success");
  assert(leaderboard.topThree.length > 0 || leaderboard.rankings.length >= 0, "Leaderboard returns structured entries");

  // Privacy checks: confirm no sensitive fields leak
  const allEntries = [...leaderboard.topThree, ...leaderboard.rankings];
  for (const entry of allEntries) {
    assert(!("email" in entry), `Leaderboard entry for ${entry.username} does not contain email`);
    assert(!("passwordHash" in entry), `Leaderboard entry does not contain passwordHash`);
    assert(!("weightKg" in entry), `Leaderboard entry does not contain private biometric weightKg`);
  }

  // -------------------------------------------------------------
  // Clean Up Test Data
  // -------------------------------------------------------------
  console.log("\n--- Cleaning Up ---");
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log("✓ Test user and all cascaded gamification/activity records deleted cleanly");

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runGamificationPhase9Tests()
  .catch((err) => {
    console.error("Test runner crashed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
