export type Gender = "male" | "female" | "prefer_not_to_say" | "other";
export type FitnessGoal =
  | "weight_loss"
  | "maintenance"
  | "muscle_gain"
  | "endurance"
  | "flexibility";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active";

export type ProfileInput = {
  age?: number | null;
  gender?: Gender | string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  fitnessGoal?: FitnessGoal | string | null;
  activityLevel?: ActivityLevel | string | null;
  targetCalories?: number | null;
};

export type ProfileValidationErrors = Record<string, string>;

export type ProfileActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: ProfileValidationErrors;
};

const VALID_GENDERS: readonly string[] = [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
];

const VALID_GOALS: readonly string[] = [
  "weight_loss",
  "maintenance",
  "muscle_gain",
  "endurance",
  "flexibility",
];

const VALID_ACTIVITY_LEVELS: readonly string[] = [
  "sedentary",
  "light",
  "moderate",
  "very_active",
];

export function calculateBmi(
  heightCm?: number | null,
  weightKg?: number | null
): { bmi: number | null; category: string | null } {
  if (
    !heightCm ||
    !weightKg ||
    heightCm <= 0 ||
    weightKg <= 0 ||
    isNaN(heightCm) ||
    isNaN(weightKg)
  ) {
    return { bmi: null, category: null };
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  let category = "normal";
  if (bmi < 18.5) {
    category = "underweight";
  } else if (bmi < 25) {
    category = "normal";
  } else if (bmi < 30) {
    category = "overweight";
  } else {
    category = "obesity";
  }

  return { bmi, category };
}

/**
 * Calculates estimated daily calorie target using Mifflin-St Jeor equation and activity/goal multiplier.
 */
export function estimateTargetCalories(params: {
  heightCm?: number | null;
  weightKg?: number | null;
  age?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
  fitnessGoal?: string | null;
}): number | null {
  const { heightCm, weightKg, age, gender, activityLevel, fitnessGoal } = params;

  if (!heightCm || !weightKg || !age || heightCm <= 0 || weightKg <= 0 || age <= 0) {
    return null;
  }

  // Base BMR (Mifflin-St Jeor formula)
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }

  // Activity multiplier
  let activityFactor = 1.2; // default sedentary
  if (activityLevel === "light") {
    activityFactor = 1.375;
  } else if (activityLevel === "moderate") {
    activityFactor = 1.55;
  } else if (activityLevel === "very_active") {
    activityFactor = 1.725;
  }

  let tdee = bmr * activityFactor;

  // Goal adjustment
  if (fitnessGoal === "weight_loss") {
    tdee -= 400; // safe modest deficit
  } else if (fitnessGoal === "muscle_gain") {
    tdee += 350; // modest surplus for lean mass
  }

  return Math.max(1200, Math.round(tdee));
}

export type PersonalizedGuidance = {
  headline: string;
  summary: string;
  recommendedRoutine: string;
  weeklyFrequency: string;
  calorieAdvice: string;
  hydrationTargetMl: number;
  activityTip: string;
  mindfulnessTip: string;
};

/**
 * Generates personalized basic fitness and lifestyle guidance based on user goal, BMI, and activity level.
 */
export function generateFitnessGuidance(params: {
  fitnessGoal?: string | null;
  bmiCategory?: string | null;
  bmi?: number | null;
  activityLevel?: string | null;
  gender?: string | null;
  targetCalories?: number | null;
  weightKg?: number | null;
}): PersonalizedGuidance {
  const goal = params.fitnessGoal || "weight_loss";
  const category = params.bmiCategory || "normal";

  // Base hydration: ~35ml per kg of bodyweight, bounded between 2000ml and 4000ml
  const weight = params.weightKg || 70;
  const calculatedWater = Math.min(
    4000,
    Math.max(2000, Math.round((weight * 35) / 250) * 250)
  );

  let headline = "Balanced Mind & Body Plan";
  let summary =
    "A balanced holistic routine integrating cardiovascular health, resistance training, and mindful recovery.";
  let recommendedRoutine = "Full-Body Functional Movement";
  let weeklyFrequency = "3–4 Days / Week";
  let calorieAdvice = params.targetCalories
    ? `Target roughly ${params.targetCalories.toLocaleString()} kcal/day to match your maintenance energy needs.`
    : "Maintain a balanced whole-food diet with balanced macronutrients.";
  let activityTip = "Stay consistent with daily steps and light movement.";
  let mindfulnessTip =
    "Practice 10 minutes of box breathing daily to modulate cortisol and support autonomic nervous system balance.";

  if (goal === "weight_loss") {
    headline = "Metabolic Conditioning & Lean Fat Loss";
    summary =
      "Combines high-density resistance circuits and aerobic tempo conditioning to maximize caloric expenditure while preserving lean muscle mass.";
    recommendedRoutine = "Full-Body Metabolic Circuit & Cardio Conditioning";
    weeklyFrequency = "3–4 Days / Week (25–35 min sessions)";
    calorieAdvice = params.targetCalories
      ? `Aim for ~${params.targetCalories.toLocaleString()} kcal/day (a safe ~400 kcal deficit) to promote steady fat loss.`
      : "Focus on nutrient-dense lean proteins, fiber-rich vegetables, and a modest caloric deficit.";
    activityTip =
      "Incorporate 7,000–10,000 daily steps and active recovery walks on non-training days.";
    mindfulnessTip =
      "Pair post-workout cool-downs with Surya or Prana Mudra and 5 minutes of mindful breath awareness to accelerate recovery.";
  } else if (goal === "muscle_gain") {
    headline = "Hypertrophy & Progressive Strength Development";
    summary =
      "Focuses on mechanical tension, progressive overload, and hypertrophy resistance training paired with sufficient protein intake.";
    recommendedRoutine = "Upper / Lower Split & Core Resistance";
    weeklyFrequency = "4–5 Days / Week (35–45 min sessions)";
    calorieAdvice = params.targetCalories
      ? `Aim for ~${params.targetCalories.toLocaleString()} kcal/day (a modest ~350 kcal surplus) to fuel muscular adaptation.`
      : "Consume 1.6–2.2g of protein per kg of body weight to optimize muscle protein synthesis.";
    activityTip =
      "Prioritize 8 hours of quality sleep for peak growth hormone release and central nervous system replenishment.";
    mindfulnessTip =
      "Incorporate Gyan Mudra during evening meditation to quiet neural fatigue and prime the body for deep restorative sleep.";
  } else if (goal === "endurance") {
    headline = "Cardiovascular Stamina & Aerobic Resilience";
    summary =
      "Designed to enhance VO2 sub-max, mitochondrial density, and cardiac output through intervals and steady-state conditioning.";
    recommendedRoutine = "Aerobic Tempo Conditioning & Core Stability";
    weeklyFrequency = "4 Days / Week (30–50 min sessions)";
    calorieAdvice = params.targetCalories
      ? `Fuel your sessions with ~${params.targetCalories.toLocaleString()} kcal/day, emphasizing complex carbohydrates for glycogen storage.`
      : "Maintain continuous hydration and replenish electrolytes around longer training sessions.";
    activityTip =
      "Monitor resting heart rate trends to balance training volume with adequate recovery periods.";
    mindfulnessTip =
      "Practice 4-7-8 rhythmic breathing before sleep to downregulate sympathetic stimulation after cardio sessions.";
  } else if (goal === "flexibility") {
    headline = "Mobility, Posture & Yogic Flow Restoration";
    summary =
      "Enhances joint range of motion, connective tissue elasticity, and postural alignment through dynamic mobility and yogic asanas.";
    recommendedRoutine = "Dynamic Yoga, Thoracic Mobility & Deep Asanas";
    weeklyFrequency = "3–5 Days / Week (20–30 min sessions)";
    calorieAdvice = params.targetCalories
      ? `Target ~${params.targetCalories.toLocaleString()} kcal/day with antioxidant-rich anti-inflammatory foods.`
      : "Focus on whole foods rich in omega-3 fatty acids to promote joint lubrication and tissue recovery.";
    activityTip =
      "Perform 5-minute movement snacks every 90 minutes of desk work to prevent postural stiffness.";
    mindfulnessTip =
      "Practice Vayu and Shunya Mudras alongside your daily flexibility routines to calm mental agitation.";
  } else if (goal === "maintenance") {
    headline = "Total Physical & Cognitive Vitality";
    summary =
      "Sustains lean muscle mass, cardiovascular conditioning, and mental sharpness for long-term healthspan.";
    recommendedRoutine = "Full-Body Strength & Cognitive Arena Sessions";
    weeklyFrequency = "3 Days / Week (30 min sessions)";
    calorieAdvice = params.targetCalories
      ? `Maintain your energy equilibrium at ~${params.targetCalories.toLocaleString()} kcal/day.`
      : "Eat intuitive, balanced meals focusing on colorful produce, quality protein, and healthy fats.";
    activityTip =
      "Engage in cross-training: play chess tactical puzzles or cognitive matrix drills after physical workouts.";
    mindfulnessTip =
      "Alternate mindfulness meditation with tactical chess games to strengthen both neural discipline and emotional composure.";
  }

  // BMI Category specific adjustments
  if (category === "underweight") {
    calorieAdvice +=
      " Note: Since your screening BMI is in the underweight range, focus on nutrient-dense calorie-rich foods and avoid aggressive caloric deficits.";
  } else if (category === "overweight") {
    activityTip +=
      " Low-impact cardio (brisk walking, cycling) is ideal to elevate caloric burn while protecting joint cartilage.";
  } else if (category === "obesity") {
    activityTip =
      "Begin with joint-friendly low-impact movements such as walking, bodyweight air squats to a box, and water aerobics. Avoid sudden high-impact plyometrics.";
  }

  return {
    headline,
    summary,
    recommendedRoutine,
    weeklyFrequency,
    calorieAdvice,
    hydrationTargetMl: calculatedWater,
    activityTip,
    mindfulnessTip,
  };
}

export function validateProfileInput(input: {
  age?: string | number | null;
  gender?: string | null;
  heightCm?: string | number | null;
  weightKg?: string | number | null;
  fitnessGoal?: string | null;
  activityLevel?: string | null;
  targetCalories?: string | number | null;
}): {
  values: {
    age: number | null;
    gender: string | null;
    heightCm: number | null;
    weightKg: number | null;
    fitnessGoal: string | null;
    activityLevel: string | null;
    targetCalories: number | null;
  };
  errors: ProfileValidationErrors;
} {
  const errors: ProfileValidationErrors = {};

  // Age validation
  let parsedAge: number | null = null;
  if (input.age !== undefined && input.age !== null && String(input.age).trim() !== "") {
    parsedAge = Number(input.age);
    if (isNaN(parsedAge) || !Number.isInteger(parsedAge)) {
      errors.age = "Age must be a whole number.";
    } else if (parsedAge < 10 || parsedAge > 120) {
      errors.age = "Age must be between 10 and 120 years.";
    }
  }

  // Height validation
  let parsedHeight: number | null = null;
  if (
    input.heightCm !== undefined &&
    input.heightCm !== null &&
    String(input.heightCm).trim() !== ""
  ) {
    parsedHeight = Number(input.heightCm);
    if (isNaN(parsedHeight)) {
      errors.heightCm = "Height must be a valid number.";
    } else if (parsedHeight < 50 || parsedHeight > 300) {
      errors.heightCm = "Height must be between 50 cm and 300 cm.";
    }
  }

  // Weight validation
  let parsedWeight: number | null = null;
  if (
    input.weightKg !== undefined &&
    input.weightKg !== null &&
    String(input.weightKg).trim() !== ""
  ) {
    parsedWeight = Number(input.weightKg);
    if (isNaN(parsedWeight)) {
      errors.weightKg = "Weight must be a valid number.";
    } else if (parsedWeight < 20 || parsedWeight > 500) {
      errors.weightKg = "Weight must be between 20 kg and 500 kg.";
    }
  }

  // Gender validation
  let parsedGender: string | null = null;
  if (input.gender && String(input.gender).trim() !== "") {
    const g = String(input.gender).trim().toLowerCase();
    if (!VALID_GENDERS.includes(g)) {
      errors.gender = "Please select a valid gender option.";
    } else {
      parsedGender = g;
    }
  }

  // Fitness Goal validation
  let parsedGoal: string | null = null;
  if (input.fitnessGoal && String(input.fitnessGoal).trim() !== "") {
    const goal = String(input.fitnessGoal).trim().toLowerCase();
    if (!VALID_GOALS.includes(goal)) {
      errors.fitnessGoal = "Please select a valid fitness goal.";
    } else {
      parsedGoal = goal;
    }
  }

  // Activity Level validation
  let parsedActivity: string | null = null;
  if (input.activityLevel && String(input.activityLevel).trim() !== "") {
    const act = String(input.activityLevel).trim().toLowerCase();
    if (!VALID_ACTIVITY_LEVELS.includes(act)) {
      errors.activityLevel = "Please select a valid activity level.";
    } else {
      parsedActivity = act;
    }
  }

  // Target Calories validation
  let parsedCalories: number | null = null;
  if (
    input.targetCalories !== undefined &&
    input.targetCalories !== null &&
    String(input.targetCalories).trim() !== ""
  ) {
    parsedCalories = Number(input.targetCalories);
    if (isNaN(parsedCalories) || parsedCalories < 0) {
      errors.targetCalories = "Target calories must be a positive number.";
    } else if (parsedCalories < 500 || parsedCalories > 10000) {
      errors.targetCalories = "Target calories should be between 500 and 10,000 kcal.";
    }
  }

  return {
    values: {
      age: parsedAge,
      gender: parsedGender,
      heightCm: parsedHeight ? Math.round(parsedHeight * 10) / 10 : null,
      weightKg: parsedWeight ? Math.round(parsedWeight * 10) / 10 : null,
      fitnessGoal: parsedGoal,
      activityLevel: parsedActivity,
      targetCalories: parsedCalories ? Math.round(parsedCalories) : null,
    },
    errors,
  };
}
