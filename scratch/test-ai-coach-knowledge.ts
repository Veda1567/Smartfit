import { generateSmartCoachResponse, type CoachUserContext } from "../src/lib/ai-coach";

async function runCoachKnowledgeTests() {
  console.log("==================================================");
  console.log("SMARTFIT OFFLINE AI COACH KNOWLEDGE & PRIORITY TESTS");
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

  // Mock Profile Context for User "Spandana"
  const ctx: CoachUserContext = {
    userId: "test_user_spandana",
    username: "Spandana",
    age: 26,
    gender: "female",
    heightCm: 165,
    weightKg: 68,
    bmi: 25.0,
    bmiCategory: "overweight",
    fitnessGoal: "weight_loss",
    activityLevel: "moderate",
    targetCalories: 1950,
    currentStreak: 6,
    currentLevel: 2,
    totalXP: 380,
    todayWaterMl: 1250,
    waterTargetMl: 2500,
    todayWorkoutDone: false,
    recentWorkoutTitle: "Full Body Circuit",
    todayWellnessDone: true,
    todayMood: "good",
    todayStress: 2,
    todayEnergy: 4,
    chessElo: 1250,
    chessGamesCount: 5,
    cognitiveBestScore: 420,
    activeChallengesCount: 3,
  };

  // --------------------------------------------------------------------------
  // TEST 1 & 2: THE REAL QA BUG — "Does BMI is correct measure to know fat levels..."
  // --------------------------------------------------------------------------
  console.log("1. Testing QA Bug: BMI vs Body Fat Measure...");
  const qaPrompt = "Does BMI is correct measure to know fat levels in human body?";
  const qaReply = await generateSmartCoachResponse(ctx, qaPrompt);

  assert(
    qaReply.toLowerCase().includes("does not directly measure body fat") ||
    qaReply.toLowerCase().includes("not directly measure body fat") ||
    qaReply.toLowerCase().includes("not an accurate measure of body fat"),
    "QA Prompt: Correctly clarifies BMI does NOT directly measure body fat"
  );
  assert(
    qaReply.includes("muscle") && qaReply.includes("bone") && qaReply.includes("tissue"),
    "QA Prompt: Explains BMI cannot distinguish muscle, fat, or bone tissue"
  );
  assert(
    qaReply.includes("DEXA") || qaReply.includes("calipers") || qaReply.includes("bioelectrical impedance"),
    "QA Prompt: Explains direct body-composition alternatives (DEXA, calipers, BIA)"
  );
  assert(
    !qaReply.includes("SmartFit Profile & Journey Summary"),
    "QA Prompt: Does NOT return Profile & Journey Summary (Bug Fixed!)"
  );
  assert(
    !qaReply.includes("Consistency Streak"),
    "QA Prompt: Does NOT dump consistency streak statistics"
  );

  // --------------------------------------------------------------------------
  // TEST 3: BMI WORDING VARIATIONS
  // --------------------------------------------------------------------------
  console.log("\n2. Testing BMI Wording Variations...");
  const bmiVariations = [
    "Is BMI accurate for body fat?",
    "Does BMI tell me my body fat?",
    "Can BMI measure fat?",
    "Is BMI a good indicator of body fat?",
    "BMI vs body fat?",
    "Does BMI actually show how much fat I have?",
    "What is the difference between BMI and body fat percentage?",
  ];

  for (const variation of bmiVariations) {
    const rep = await generateSmartCoachResponse(ctx, variation);
    const isValidAnswer =
      (rep.includes("DEXA") || rep.includes("body fat") || rep.includes("tissue")) &&
      !rep.includes("SmartFit Profile & Journey Summary");
    assert(isValidAnswer, `BMI Variation: "${variation}" returns direct knowledge answer`);
  }

  // --------------------------------------------------------------------------
  // TEST 4: FITNESS GENERAL KNOWLEDGE
  // --------------------------------------------------------------------------
  console.log("\n3. Testing Fitness General Knowledge...");

  const poReply = await generateSmartCoachResponse(ctx, "What is progressive overload?");
  assert(
    poReply.includes("Progressive Overload") && (poReply.includes("resistance") || poReply.includes("reps") || poReply.includes("stress")),
    "Fitness: Explains progressive overload principles"
  );
  assert(!poReply.includes("SmartFit Profile & Journey Summary"), "Fitness: Progressive overload is not confused with progress summary");

  const wuReply = await generateSmartCoachResponse(ctx, "Why should I warm up before exercise?");
  assert(
    wuReply.includes("Warm-Up") && (wuReply.includes("temperature") || wuReply.includes("synovial") || wuReply.includes("injury")),
    "Fitness: Explains warm-up physiological rationale"
  );

  const stretchReply = await generateSmartCoachResponse(ctx, "What is the benefit of stretching?");
  assert(
    stretchReply.includes("Stretching") && (stretchReply.toLowerCase().includes("range of motion") || stretchReply.toLowerCase().includes("flexibility")),
    "Fitness: Explains stretching and flexibility benefits"
  );

  const cardioWeightsReply = await generateSmartCoachResponse(ctx, "Cardio vs strength training: which is better?");
  assert(
    cardioWeightsReply.includes("Cardiovascular") && cardioWeightsReply.includes("Strength"),
    "Fitness: Explains cardio vs strength training comparison"
  );

  const freqReply = await generateSmartCoachResponse(ctx, "Why are rest days important?");
  assert(
    freqReply.includes("Rest Days") && freqReply.includes("repair"),
    "Fitness: Explains rest days and recovery necessity"
  );

  // --------------------------------------------------------------------------
  // TEST 5: BODY METRICS (BMR & TDEE)
  // --------------------------------------------------------------------------
  console.log("\n4. Testing Body Metrics (BMR & TDEE)...");

  const bmrReply = await generateSmartCoachResponse(ctx, "What is BMR?");
  assert(
    bmrReply.includes("Basal Metabolic Rate") && bmrReply.includes("rest"),
    "Metrics: Explains BMR definition and rest expenditure"
  );

  const tdeeReply = await generateSmartCoachResponse(ctx, "What is TDEE?");
  assert(
    tdeeReply.includes("Total Daily Energy Expenditure") && (tdeeReply.includes("BMR") || tdeeReply.includes("NEAT")),
    "Metrics: Explains TDEE components (BMR, NEAT, EAT, TEF)"
  );

  // --------------------------------------------------------------------------
  // TEST 6: NUTRITION GENERAL KNOWLEDGE
  // --------------------------------------------------------------------------
  console.log("\n5. Testing Nutrition General Knowledge...");

  const macroReply = await generateSmartCoachResponse(ctx, "What is the difference between protein and carbohydrates?");
  assert(
    macroReply.includes("Protein") && macroReply.includes("Carbohydrates") && macroReply.includes("4 kcal"),
    "Nutrition: Explains protein vs carbohydrate roles and caloric density"
  );

  const prePostReply = await generateSmartCoachResponse(ctx, "What to eat before and after a workout?");
  assert(
    prePostReply.includes("Pre-Workout") && prePostReply.includes("Post-Workout"),
    "Nutrition: Provides pre-workout and post-workout nutritional timing"
  );

  // --------------------------------------------------------------------------
  // TEST 7: HYDRATION GENERAL KNOWLEDGE
  // --------------------------------------------------------------------------
  console.log("\n6. Testing Hydration General Knowledge...");

  const waterReply = await generateSmartCoachResponse(ctx, "How much water should I drink?");
  assert(
    waterReply.includes("30 to 35 ml") || waterReply.includes("per kilogram"),
    "Hydration: Explains standard water intake formula (30-35 ml/kg)"
  );
  assert(
    waterReply.includes("2,500 ml") || waterReply.includes("2500"),
    "Hydration: Contextually incorporates Spandana's calibrated 2,500ml target"
  );

  const dehyReply = await generateSmartCoachResponse(ctx, "What happens if I get dehydrated during exercise?");
  assert(
    dehyReply.includes("Dehydration") && (dehyReply.includes("2%") || dehyReply.includes("cramping") || dehyReply.includes("performance")),
    "Hydration: Explains dehydration symptoms and performance degradation"
  );

  // --------------------------------------------------------------------------
  // TEST 8: SLEEP & RECOVERY
  // --------------------------------------------------------------------------
  console.log("\n7. Testing Sleep & Recovery Knowledge...");

  const sleepReply = await generateSmartCoachResponse(ctx, "Why is sleep important for fitness?");
  assert(
    sleepReply.includes("Sleep") && (sleepReply.includes("Growth Hormone") || sleepReply.includes("HGH") || sleepReply.includes("7 to 9 hours")),
    "Recovery: Explains sleep architecture, HGH release, and muscle repair"
  );

  // --------------------------------------------------------------------------
  // TEST 9: MENTAL WELLNESS & BREATHWORK
  // --------------------------------------------------------------------------
  console.log("\n8. Testing Mental Wellness & Breathwork...");

  const medReply = await generateSmartCoachResponse(ctx, "What is meditation and how do I start?");
  assert(
    medReply.includes("Meditation") && medReply.includes("breath"),
    "Mental Wellness: Explains meditation concepts and beginner breath awareness"
  );

  const boxReply = await generateSmartCoachResponse(ctx, "What is box breathing?");
  assert(
    boxReply.includes("Box Breathing") && (boxReply.includes("4-4-4-4") || boxReply.includes("4s")),
    "Mental Wellness: Explains 4-4-4-4 box breathing technique"
  );

  // --------------------------------------------------------------------------
  // TEST 10: YOGA & MUDRAS
  // --------------------------------------------------------------------------
  console.log("\n9. Testing Yoga & Mudras Knowledge...");

  const mudraReply = await generateSmartCoachResponse(ctx, "What are mudras and how do they work?");
  assert(
    mudraReply.includes("Mudras") && (mudraReply.includes("Gyan") || mudraReply.includes("Prana") || mudraReply.includes("Vayu")),
    "Mudras: Explains hand mudras purpose and supported SmartFit mudras"
  );

  // --------------------------------------------------------------------------
  // TEST 11: SMARTFIT FEATURES
  // --------------------------------------------------------------------------
  console.log("\n10. Testing SmartFit Features Knowledge...");

  const smartfitReply = await generateSmartCoachResponse(ctx, "How does SmartFit work?");
  assert(
    smartfitReply.includes("SmartFit") && (smartfitReply.includes("Fitness") || smartfitReply.includes("Camera") || smartfitReply.includes("Wellness")),
    "Features: Explains SmartFit ecosystem pillars"
  );

  const xpReply = await generateSmartCoachResponse(ctx, "How do I earn XP in SmartFit?");
  assert(
    xpReply.includes("XP") && (xpReply.includes("+100") || xpReply.includes("Formula")),
    "Features: Details XP earning activities and leveling formula"
  );

  const camCoachReply = await generateSmartCoachResponse(ctx, "What is the AI Camera Form Coach and is it private?");
  assert(
    camCoachReply.includes("AI Camera") && camCoachReply.includes("Privacy") && (camCoachReply.includes("Squats") || camCoachReply.includes("Push-ups")),
    "Features: Explains camera coach, on-device privacy guarantee, and exercises"
  );

  // --------------------------------------------------------------------------
  // TEST 12: PERSONALIZED INQUIRIES PRESERVE PROFILE
  // --------------------------------------------------------------------------
  console.log("\n11. Testing Personalized Inquiries...");

  const personalBmiReply = await generateSmartCoachResponse(ctx, "My BMI is 25.0. What does it mean for me?");
  assert(
    personalBmiReply.includes("25.0") && personalBmiReply.includes("Spandana"),
    "Personalized: Interprets user's exact BMI (25.0) for Spandana"
  );

  const personalWorkout = await generateSmartCoachResponse(ctx, "Based on my profile, what workout should I do?");
  assert(
    personalWorkout.toLowerCase().includes("weight loss") || personalWorkout.includes("Compound") || personalWorkout.includes("Squats"),
    "Personalized: Recommends workout aligned with Spandana's weight_loss goal"
  );

  // --------------------------------------------------------------------------
  // TEST 13: EXPLICIT PROFILE SUMMARY REQUEST
  // --------------------------------------------------------------------------
  console.log("\n12. Testing Explicit Profile Summary Requests...");

  const explicitSummaryReply = await generateSmartCoachResponse(ctx, "Review my weekly SmartFit progress");
  assert(
    explicitSummaryReply.includes("SmartFit Profile & Journey Summary for Spandana") && explicitSummaryReply.includes("Level 2"),
    "Summary: Generates full journey summary when explicitly requested ('Review my weekly SmartFit progress')"
  );

  const explicitStatsReply = await generateSmartCoachResponse(ctx, "Show my profile summary");
  assert(
    explicitStatsReply.includes("SmartFit Profile & Journey Summary for Spandana"),
    "Summary: Generates full journey summary for 'Show my profile summary'"
  );

  // --------------------------------------------------------------------------
  // TEST 14: OUT-OF-DOMAIN QUESTIONS
  // --------------------------------------------------------------------------
  console.log("\n13. Testing Out-of-Domain Boundaries...");

  const outOfDomain1 = await generateSmartCoachResponse(ctx, "What is the capital of France?");
  assert(
    outOfDomain1.includes("SmartFit Fitness & Wellness Coach") && outOfDomain1.includes("not designed for topics outside"),
    "Out-of-Domain: Gracefully redirects general geography trivia ('capital of France')"
  );

  const outOfDomain2 = await generateSmartCoachResponse(ctx, "Write Python code to implement binary search");
  assert(
    outOfDomain2.includes("SmartFit Fitness & Wellness Coach") && outOfDomain2.includes("not designed for topics outside"),
    "Out-of-Domain: Gracefully redirects programming questions"
  );

  const outOfDomain3 = await generateSmartCoachResponse(ctx, "Who won the presidential election?");
  assert(
    outOfDomain3.includes("SmartFit Fitness & Wellness Coach") && outOfDomain3.includes("not designed for topics outside"),
    "Out-of-Domain: Gracefully redirects political questions"
  );

  // --------------------------------------------------------------------------
  // TEST 15: MEDICAL & CLINICAL SAFETY INTERCEPT
  // --------------------------------------------------------------------------
  console.log("\n14. Testing Medical Safety Intercept...");

  const emergencyReply = await generateSmartCoachResponse(ctx, "I have crushing chest pain and shortness of breath");
  assert(
    emergencyReply.includes("Important Safety Notice") && emergencyReply.includes("emergency medical services"),
    "Safety: Intercepts acute chest pain with emergency directive"
  );

  const medDosageReply = await generateSmartCoachResponse(ctx, "Can you prescribe steroid medication dosage for fast gains?");
  assert(
    medDosageReply.includes("Important Safety Notice") && medDosageReply.includes("cannot diagnose conditions, prescribe medication"),
    "Safety: Intercepts drug/steroid prescription query"
  );

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} ASSERTIONS PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("ALL AI COACH KNOWLEDGE & PRIORITY TESTS PASSED!\n");
    process.exit(0);
  } else {
    console.error("SOME TESTS FAILED!\n");
    process.exit(1);
  }
}

runCoachKnowledgeTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
