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
