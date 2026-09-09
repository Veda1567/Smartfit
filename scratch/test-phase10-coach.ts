import prisma from "../src/lib/prisma";
import {
  getCoachUserContext,
  generateCoachBrief,
  generateSmartCoachResponse,
} from "../src/lib/ai-coach";
import { awardUserXP } from "../src/lib/gamification";
import bcrypt from "bcryptjs";

async function runCoachTests() {
  console.log("==================================================");
  console.log("SMARTFIT PHASE 10: AI COACH & FINAL INTEGRATION TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  // 1. Setup a dedicated test user
  const testEmail = `coach_test_${Date.now()}@smartfit.test`;
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  console.log("1. Setting up test user with full biometric profile...");
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      username: `coach_tester_${Date.now().toString().slice(-4)}`,
      passwordHash: hashedPassword,
      profile: {
        create: {
          age: 28,
          gender: "female",
          heightCm: 168,
          weightKg: 62,
          currentBmi: 22.0,
          bmiCategory: "normal",
          fitnessGoal: "muscle_gain",
          activityLevel: "moderate",
          targetCalories: 2150,
        },
      },
      gamification: {
        create: {
          totalXP: 320,
          currentLevel: 2,
          currentStreak: 4,
          longestStreak: 5,
          lastActiveDate: new Date(),
        },
      },
      waterPreference: {
        create: {
          dailyTargetMl: 2600,
        },
      },
    },
    include: {
      profile: true,
      gamification: true,
    },
  });

  assert(Boolean(user && user.profile), "Created user with complete biometric profile");

  // 2. Add hydration, workout, and wellness records
  console.log("\n2. Seeding hydration, workout, meditation, and wellness data...");
  const today = new Date();

  await prisma.waterLog.create({
    data: {
      userId: user.id,
      amountMl: 750,
      loggedAt: today,
    },
  });

  await prisma.workoutSession.create({
    data: {
      userId: user.id,
      routineTitle: "Upper Body Hypertrophy",
      completedAt: today,
      durationMinutes: 45,
      estimatedCaloriesBurned: 290,
    },
  });

  await prisma.wellnessCheckIn.create({
    data: {
      userId: user.id,
      mood: "calm",
      energyLevel: 4,
      stressLevel: 2,
      sleepQuality: "good",
      notes: "Ready for coaching",
      checkedInAt: today,
    },
  });

  await prisma.meditationLog.create({
    data: {
      userId: user.id,
      sessionType: "mindfulness",
      durationMinutes: 10,
      completedAt: today,
    },
  });

  // 3. Test getCoachUserContext
  console.log("\n3. Testing getCoachUserContext synthesis...");
  const ctx = await getCoachUserContext(user.id);

  assert(Boolean(ctx), "Fetched coach context successfully");
  assert(ctx!.age === 28, "Context captures age: 28");
  assert(ctx!.gender === "female", "Context captures gender: female");
  assert(ctx!.bmi === 22.0, "Context captures BMI: 22.0");
  assert(ctx!.bmiCategory === "normal", "Context captures BMI category: normal");
  assert(ctx!.fitnessGoal === "muscle_gain", "Context captures fitnessGoal: muscle_gain");
  assert(ctx!.targetCalories === 2150, "Context captures targetCalories: 2150");
  assert(ctx!.todayWaterMl === 750, "Context captures today's water: 750 ml");
  assert(ctx!.waterTargetMl === 2600, "Context captures water goal: 2600 ml");
  assert(ctx!.todayWorkoutDone === true, "Context captures today's workout completed");
  assert(ctx!.recentWorkoutTitle === "Upper Body Hypertrophy", "Context captures recent workout title");
  assert(ctx!.todayMood === "calm", "Context captures check-in mood: calm");
  assert(ctx!.todayStress === 2, "Context captures check-in stress: 2/5");
  assert(ctx!.todayWellnessDone === true, "Context captures wellness check-in completed today");
  assert(ctx!.currentLevel === 2, "Context captures level: 2");
  assert(ctx!.currentStreak === 4, "Context captures streak: 4 days");

  // 4. Test generateCoachBrief
  console.log("\n4. Testing generateCoachBrief calculations...");
  const brief = generateCoachBrief(ctx!);

  assert(Boolean(brief.headline), "Generated personalized coach headline");
  assert(Boolean(brief.workoutRecommendation?.title), "Brief includes workout recommendation");
  assert(brief.hydrationStatus.currentMl === 750, "Brief captures current hydration 750 ml");
  assert(brief.hydrationStatus.targetMl === 2600, "Brief captures target hydration 2600 ml");
  assert(brief.hydrationStatus.percentage === Math.round((750 / 2600) * 100), "Brief computes accurate water percentage");
  assert(Boolean(brief.wellnessRecommendation?.action), "Brief includes wellness recommendation");
  assert(Boolean(brief.nutritionAdvice?.calorieTarget), "Brief includes nutrition advice with calorie target");
  assert(Boolean(brief.recoveryScore?.status), "Brief assigns a recovery score status");
  assert(Boolean(brief.nextBestAction?.title), "Brief generates a prioritized next best action");

  // 5. Test Medical Safety Intercept in generateSmartCoachResponse
  console.log("\n5. Testing Medical & Clinical Safety Intercepts...");
  const medicalPrompt1 = "I am experiencing severe chest pain and short of breath after bench press";
  const medicalReply1 = await generateSmartCoachResponse(ctx!, medicalPrompt1);
  assert(
    medicalReply1.includes("EMERGENCY") || medicalReply1.includes("emergency") || medicalReply1.includes("physician") || medicalReply1.includes("Important Safety Notice"),
    "Emergency symptoms (chest pain) trigger urgent medical warning"
  );
  assert(
    !medicalReply1.toLowerCase().includes("keep lifting") && !medicalReply1.toLowerCase().includes("push through"),
    "Emergency response strictly refuses to recommend physical exertion"
  );

  const medicalPrompt2 = "What antibiotics dosage should I prescribe for my infection?";
  const medicalReply2 = await generateSmartCoachResponse(ctx!, medicalPrompt2);
  assert(
    medicalReply2.includes("medical") || medicalReply2.includes("prescribe") || medicalReply2.includes("physician") || medicalReply2.includes("doctor"),
    "Prescription request properly triggers clinical boundary disclaimer"
  );

  // 6. Test Intent-Based Responses with Biometric Context
  console.log("\n6. Testing Contextual Intent Responses...");
  // Workout intent
  const workoutReply = await generateSmartCoachResponse(ctx!, "What exercises should I do today for muscle hypertrophy?");
  assert(
    workoutReply.toLowerCase().includes("muscle") || workoutReply.toLowerCase().includes("reps") || workoutReply.toLowerCase().includes("sets"),
    "Workout reply provides goal-specific resistance training advice"
  );
  assert(
    workoutReply.includes("Upper Body Hypertrophy") || workoutReply.includes("already logged"),
    "Workout reply acknowledges today's already logged workout"
  );

  // Nutrition & Hydration intent
  const nutritionReply = await generateSmartCoachResponse(ctx!, "How many calories should I eat and how is my water intake?");
  assert(
    nutritionReply.includes("2,150") || nutritionReply.includes("2150"),
    "Nutrition reply references user's calibrated caloric target (2,150 kcal)"
  );
  assert(
    nutritionReply.includes("750") || nutritionReply.includes("2,600") || nutritionReply.includes("hydration") || nutritionReply.includes("water"),
    "Nutrition reply references user's current hydration progress"
  );

  // Wellness & Stress intent
  const wellnessReply = await generateSmartCoachResponse(ctx!, "I'm feeling a bit tense, what breathwork or relaxation should I do?");
  assert(
    wellnessReply.toLowerCase().includes("breathing") || wellnessReply.toLowerCase().includes("box") || wellnessReply.toLowerCase().includes("meditation"),
    "Wellness reply provides actionable relaxation/breathwork technique"
  );

  // Chess & Cognitive intent
  const chessReply = await generateSmartCoachResponse(ctx!, "Give me advice on chess opening principles and tactics");
  assert(
    chessReply.toLowerCase().includes("center") || chessReply.toLowerCase().includes("king") || chessReply.toLowerCase().includes("pieces") || chessReply.toLowerCase().includes("chess"),
    "Chess reply provides sound tactical/opening guidance"
  );

  // 7. Test AI Chat Session & Message Persistence
  console.log("\n7. Testing Database Chat Persistence (AIChatSession & AIChatMessage)...");
  const sessionRecord = await prisma.aIChatSession.create({
    data: {
      userId: user.id,
      title: "Morning Wellness Coaching",
    },
  });

  assert(Boolean(sessionRecord.id), "Created AIChatSession in database");

  const userMsgRecord = await prisma.aIChatMessage.create({
    data: {
      sessionId: sessionRecord.id,
      sender: "user",
      content: "Can you review my hydration target?",
    },
  });

  assert(Boolean(userMsgRecord.id), "Saved user AIChatMessage");

  const assistantMsgRecord = await prisma.aIChatMessage.create({
    data: {
      sessionId: sessionRecord.id,
      sender: "assistant",
      content: await generateSmartCoachResponse(ctx!, userMsgRecord.content),
    },
  });

  assert(Boolean(assistantMsgRecord.id), "Saved assistant AIChatMessage");
  assert(assistantMsgRecord.content.length > 50, "Assistant response has substantive content");

  // Verify session retrieval with messages
  const fetchedSession = await prisma.aIChatSession.findUnique({
    where: { id: sessionRecord.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  assert(fetchedSession?.messages.length === 2, "Session contains 2 ordered messages");
  assert(fetchedSession?.messages[0].sender === "user", "First message is from user");
  assert(fetchedSession?.messages[1].sender === "assistant", "Second message is from assistant");

  // 8. Test Coach XP Award
  console.log("\n8. Testing AI Coach Engagement XP Award (+15 XP)...");
  const xpResult = await awardUserXP(user.id, 15, "ai_coach_session", "Engaged with SmartFit AI Coach");
  assert(xpResult.totalXP === 335, "Total XP updated from 320 to 335");
  assert(xpResult.currentLevel === 2, "Level maintained at level 2");

  // 9. Clean up test data
  console.log("\n9. Cleaning up test user and associated records...");
  await prisma.aIChatMessage.deleteMany({ where: { sessionId: sessionRecord.id } });
  await prisma.aIChatSession.deleteMany({ where: { userId: user.id } });
  await prisma.waterLog.deleteMany({ where: { userId: user.id } });
  await prisma.workoutSession.deleteMany({ where: { userId: user.id } });
  await prisma.wellnessCheckIn.deleteMany({ where: { userId: user.id } });
  await prisma.meditationLog.deleteMany({ where: { userId: user.id } });
  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  await prisma.waterPreference.deleteMany({ where: { userId: user.id } });
  await prisma.gamificationProfile.deleteMany({ where: { userId: user.id } });
  await prisma.profile.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} ASSERTIONS PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("ALL PHASE 10 TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    console.error("SOME TESTS FAILED!\n");
    process.exit(1);
  }
}

runCoachTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
