import {
  generatePersonalizedWorkoutPlan,
  getWorkoutRegimen,
} from "../src/lib/workout-routines";
import { getFoodGuidance } from "../src/lib/food-guidance";
import {
  validateWellnessCheckIn,
  getPersonalizedWellnessRecommendations,
  DAILY_WELLNESS_ROUTINE,
} from "../src/lib/wellness";
import {
  calculateCameraSessionCalories,
  EXERCISE_CONFIGS,
} from "../src/lib/pose-analysis";

async function runFitnessAndWellnessRegressionTests() {
  console.log("==================================================");
  console.log("SMARTFIT FITNESS & MENTAL WELLNESS REGRESSION TESTS");
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

  // --------------------------------------------------------------------------
  // 1. FITNESS REGIMEN & PLAN GENERATION
  // --------------------------------------------------------------------------
  console.log("1. Testing Workout Plan Generation for Goals...");

  const weightLossPlan = generatePersonalizedWorkoutPlan({
    fitnessGoal: "weight_loss",
    weightKg: 85,
    heightCm: 175,
    bmi: 27.7,
    bmiCategory: "overweight",
  });
  assert(Boolean(weightLossPlan.routines.length >= 2), "Weight loss plan provides day routines");
  assert(weightLossPlan.routines[0].estimatedCalories > 150, "Routines calculate positive caloric expenditure");
  assert(weightLossPlan.lowImpactModifications === true, "High-BMI user triggers low-impact joint modifications");

  const muscleGainPlan = generatePersonalizedWorkoutPlan({
    fitnessGoal: "muscle_gain",
    weightKg: 70,
    activityLevel: "moderate",
  });
  assert(muscleGainPlan.goalTitle === "Strength & Muscle Tone", "Muscle gain regimen matches goal title");
  assert(muscleGainPlan.routines.length >= 2, "Muscle gain provides split routines");

  const endurancePlan = generatePersonalizedWorkoutPlan({
    fitnessGoal: "endurance",
  });
  assert(endurancePlan.goalTitle === "Cardiovascular Endurance", "Endurance plan matches cardiovascular title");

  // Verify getWorkoutRegimen handles known and fallback goals
  for (const goal of ["weight_loss", "muscle_gain", "endurance", "flexibility", "maintenance"]) {
    const reg = getWorkoutRegimen(goal);
    assert(Boolean(reg && reg.routines.length > 0), `Regimen retrieved successfully for goal: ${goal}`);
  }
  const fallbackReg = getWorkoutRegimen("unknown_goal");
  assert(fallbackReg.goalKey === "maintenance", "Unknown goal safely falls back to maintenance regimen");

  // --------------------------------------------------------------------------
  // 2. NUTRITION GUIDANCE
  // --------------------------------------------------------------------------
  console.log("\n2. Testing Nutrition Guidance Calculations...");

  const guidance = getFoodGuidance({
    fitnessGoal: "muscle_gain",
    targetCalories: 2400,
    weightKg: 75,
    activityLevel: "very_active",
  });
  assert(Boolean(guidance.macroDistribution.protein), "Guidance produces protein macro distribution");
  assert(Boolean(guidance.mealPlanSuggestions.length > 0), "Guidance produces sample meal plan suggestions");
  assert(Boolean(guidance.recommendedCategories.length > 0), "Guidance produces recommended food categories");

  // --------------------------------------------------------------------------
  // 3. HYDRATION TARGET FORMULA
  // --------------------------------------------------------------------------
  console.log("\n3. Testing Hydration Target Formulas...");

  function computeDailyWaterTarget(weightKg?: number | null): number {
    return weightKg
      ? Math.min(4000, Math.max(2000, Math.round((weightKg * 35) / 250) * 250))
      : 2500;
  }

  assert(computeDailyWaterTarget(null) === 2500, "Default hydration target without weight is 2500 ml");
  assert(computeDailyWaterTarget(60) === 2000, "60kg user calculates target 2000 ml (60 * 35 = 2100 -> rounded)");
  assert(computeDailyWaterTarget(80) === 2750, "80kg user calculates target 2750 ml (80 * 35 = 2800 -> rounded)");
  assert(computeDailyWaterTarget(130) === 4000, "Heavy user capped at upper bound 4000 ml");
  assert(computeDailyWaterTarget(45) === 2000, "Light user floored at lower bound 2000 ml");

  // --------------------------------------------------------------------------
  // 4. CAMERA MET CALORIE EXPENDITURE FORMULAS
  // --------------------------------------------------------------------------
  console.log("\n4. Testing Camera Workout Session Calorie Formulas...");

  // Formula: (MET * 3.5 * weightKg / 200) * minutes + (reps * 0.35)
  const squatCal10m = calculateCameraSessionCalories("squat", 10, 20, 70);
  assert(squatCal10m === 68, `Squat MET formula accurate: 68 kcal for 10m/20reps/70kg (got ${squatCal10m})`);

  const pushupCal10m = calculateCameraSessionCalories("pushup", 10, 30, 70);
  assert(pushupCal10m === 109, `Push-up MET formula accurate: 109 kcal for 10m/30reps/70kg (got ${pushupCal10m})`);

  const curlCal5m = calculateCameraSessionCalories("bicep_curl", 5, 25, 70);
  assert(curlCal5m === 33, `Bicep curl MET formula accurate: 33 kcal for 5m/25reps/70kg (got ${curlCal5m})`);

  assert(EXERCISE_CONFIGS.squat.metValue === 5.0, "Squat MET value is 5.0");
  assert(EXERCISE_CONFIGS.pushup.metValue === 8.0, "Push-up MET value is 8.0");
  assert(EXERCISE_CONFIGS.bicep_curl.metValue === 4.0, "Bicep curl MET value is 4.0");

  // --------------------------------------------------------------------------
  // 5. MENTAL WELLNESS & STRESS-MODULATION
  // --------------------------------------------------------------------------
  console.log("\n5. Testing Mental Wellness Check-In Validation & Recommendations...");

  const validCheckIn = validateWellnessCheckIn({
    mood: "stressed",
    stressLevel: 4,
    energyLevel: 2,
    sleepQuality: "poor",
    notes: "Exams coming up",
  });
  assert(Object.keys(validCheckIn.errors).length === 0, "Valid check-in produces zero validation errors");
  assert(validCheckIn.values.mood === "stressed", "Check-in retains stressed mood");
  assert(validCheckIn.values.stressLevel === 4, "Check-in retains stress level 4");

  const invalidCheckIn = validateWellnessCheckIn({
    mood: "ecstatic_and_wild", // invalid
    stressLevel: 99, // out of range
  });
  assert(Boolean(invalidCheckIn.errors.mood), "Invalid mood generates validation error");
  assert(Boolean(invalidCheckIn.errors.stressLevel), "Out-of-range stress level generates validation error");

  const recs = getPersonalizedWellnessRecommendations({
    mood: "stressed",
    stressLevel: 5,
    sleepQuality: "poor",
  });
  assert(Boolean(recs.recommendedBreathing), "High-stress check-in recommends down-regulating breathwork");
  assert(Boolean(recs.recommendedMeditation), "High-stress check-in provides meditation session");
  assert(Boolean(recs.recommendedMudra), "High-stress check-in provides mudra recommendation");
  assert(recs.supportiveMessage.length > 20, "Supportive empathy message provided");
  assert(DAILY_WELLNESS_ROUTINE.length >= 4, "Daily wellness routine provides 4 schedule checkpoints");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} / ${total} ASSERTIONS PASSED`);
  console.log("==================================================");

  if (passed === total) {
    console.log("ALL FITNESS & WELLNESS REGRESSION TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    console.error("SOME REGRESSION TESTS FAILED!\n");
    process.exit(1);
  }
}

runFitnessAndWellnessRegressionTests().catch((err) => {
  console.error("Fatal regression test error:", err);
  process.exit(1);
});
