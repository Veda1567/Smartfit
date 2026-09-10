import prisma from "@/lib/prisma";
import { generateFitnessGuidance } from "@/lib/validations/profile";
import { getLevelProgress, getEffectiveStreak } from "@/lib/gamification";
import {
  matchGeneralKnowledge,
  isExplicitProfileSummaryRequest,
  isOutOfDomainQuery,
  generateOutOfDomainResponse,
} from "./coach-knowledge";

export {
  matchGeneralKnowledge,
  isExplicitProfileSummaryRequest,
  isOutOfDomainQuery,
  generateOutOfDomainResponse,
} from "./coach-knowledge";

export interface CoachUserContext {
  userId: string;
  username: string;
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bmiCategory?: string | null;
  fitnessGoal?: string | null;
  activityLevel?: string | null;
  targetCalories?: number | null;
  currentStreak: number;
  currentLevel: number;
  totalXP: number;
  todayWaterMl: number;
  waterTargetMl: number;
  todayWorkoutDone: boolean;
  recentWorkoutTitle?: string;
  todayWellnessDone: boolean;
  todayMood?: string;
  todayStress?: number;
  todayEnergy?: number;
  chessElo: number;
  chessGamesCount: number;
  cognitiveBestScore: number;
  activeChallengesCount: number;
}

export interface CoachBrief {
  headline: string;
  workoutRecommendation: {
    title: string;
    duration: string;
    focus: string;
    intensity: string;
  };
  hydrationStatus: {
    currentMl: number;
    targetMl: number;
    percentage: number;
    statusText: string;
  };
  wellnessRecommendation: {
    action: string;
    technique: string;
    rationale: string;
  };
  nutritionAdvice: {
    calorieTarget: string;
    macroFocus: string;
    practicalTip: string;
  };
  recoveryScore: {
    status: "Fresh & Ready" | "Moderate Recovery" | "Rest & Recharge";
    advice: string;
  };
  nextBestAction: {
    title: string;
    description: string;
    href: string;
    cta: string;
  };
}

/**
 * Compiles a comprehensive snapshot of the user's active fitness, wellness, and cognitive metrics.
 */
export async function getCoachUserContext(userId: string): Promise<CoachUserContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      gamification: true,
      waterPreference: true,
      waterLogs: true,
      workoutSessions: {
        orderBy: { completedAt: "desc" },
        take: 3,
      },
      wellnessCheckIns: {
        orderBy: { checkedInAt: "desc" },
        take: 1,
      },
      chessStats: true,
      brainGameAttempts: {
        orderBy: { score: "desc" },
        take: 1,
      },
      userChallenges: {
        where: { isCompleted: false },
      },
    },
  });

  if (!user) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const profile = user.profile;
  const gamification = user.gamification;
  const streakInfo = getEffectiveStreak(gamification);
  const levelInfo = getLevelProgress(gamification?.totalXP ?? 0);

  const todayWaterMl = user.waterLogs
    .filter((log) => new Date(log.loggedAt) >= startOfToday)
    .reduce((sum, log) => sum + log.amountMl, 0);

  const waterTargetMl = user.waterPreference?.dailyTargetMl ?? 2500;

  const todayWorkouts = user.workoutSessions.filter(
    (w) => new Date(w.completedAt) >= startOfToday
  );
  const todayWorkoutDone = todayWorkouts.length > 0;
  const recentWorkoutTitle = user.workoutSessions[0]?.routineTitle;

  const latestCheckIn = user.wellnessCheckIns[0];
  const todayWellnessDone = Boolean(
    latestCheckIn && new Date(latestCheckIn.checkedInAt) >= startOfToday
  );

  return {
    userId,
    username: user.username,
    age: profile?.age,
    gender: profile?.gender,
    heightCm: profile?.heightCm,
    weightKg: profile?.weightKg,
    bmi: profile?.currentBmi,
    bmiCategory: profile?.bmiCategory,
    fitnessGoal: profile?.fitnessGoal,
    activityLevel: profile?.activityLevel,
    targetCalories: profile?.targetCalories,
    currentStreak: streakInfo.currentStreak,
    currentLevel: levelInfo.currentLevel,
    totalXP: levelInfo.totalXP,
    todayWaterMl,
    waterTargetMl,
    todayWorkoutDone,
    recentWorkoutTitle,
    todayWellnessDone,
    todayMood: latestCheckIn?.mood,
    todayStress: latestCheckIn?.stressLevel,
    todayEnergy: latestCheckIn?.energyLevel,
    chessElo: user.chessStats?.eloRating ?? 1200,
    chessGamesCount: user.chessStats?.gamesPlayed ?? 0,
    cognitiveBestScore: user.brainGameAttempts[0]?.score ?? 0,
    activeChallengesCount: user.userChallenges.length,
  };
}

/**
 * Builds an actionable, structured daily coaching brief based on user context.
 */
export function generateCoachBrief(ctx: CoachUserContext): CoachBrief {
  const guidance = generateFitnessGuidance({
    fitnessGoal: ctx.fitnessGoal,
    bmiCategory: ctx.bmiCategory,
    bmi: ctx.bmi,
    activityLevel: ctx.activityLevel,
    gender: ctx.gender,
    targetCalories: ctx.targetCalories,
    weightKg: ctx.weightKg,
  });

  const waterPct = Math.min(100, Math.round((ctx.todayWaterMl / Math.max(1, ctx.waterTargetMl)) * 100));

  // Determine recovery condition
  let recoveryStatus: "Fresh & Ready" | "Moderate Recovery" | "Rest & Recharge" = "Fresh & Ready";
  let recoveryAdvice = "Your nervous system and muscles are ready for active stimulus today.";

  if (ctx.todayStress && ctx.todayStress >= 4) {
    recoveryStatus = "Rest & Recharge";
    recoveryAdvice = "Elevated stress detected in your check-in. Prioritize down-regulating breathwork and gentle stretching.";
  } else if (ctx.todayWorkoutDone) {
    recoveryStatus = "Moderate Recovery";
    recoveryAdvice = "Workout logged today! Hydrate well, consume lean protein, and incorporate 5 minutes of mobility.";
  }

  // Next Best Action determination
  let nextBestAction = {
    title: "Complete Today's Workout",
    description: `Targeting your goal: ${guidance.recommendedRoutine}.`,
    href: "/fitness",
    cta: "Start Workout",
  };

  if (ctx.todayWorkoutDone && !ctx.todayWellnessDone) {
    nextBestAction = {
      title: "Mindful Wellness Reflection",
      description: "Log your daily mood & stress check-in to claim +25 XP and calibrate recovery.",
      href: "/wellness",
      cta: "Check In (+25 XP)",
    };
  } else if (ctx.todayWorkoutDone && ctx.todayWellnessDone && waterPct < 100) {
    nextBestAction = {
      title: "Hydration Milestone",
      description: `You are at ${waterPct}% of your ${ctx.waterTargetMl}ml water quota. Log a glass to stay hydrated.`,
      href: "/fitness",
      cta: "Log Water",
    };
  } else if (ctx.todayWorkoutDone && ctx.todayWellnessDone && waterPct >= 100) {
    nextBestAction = {
      title: "Tactical Chess or Brain Drill",
      description: "Sharp mind, strong body. Play an AI chess match or complete a cognitive speed matrix.",
      href: "/chess",
      cta: "Play Chess",
    };
  }

  return {
    headline: `Hello, ${ctx.username}! Let's optimize your mind-body balance today.`,
    workoutRecommendation: {
      title: guidance.recommendedRoutine,
      duration: "20–30 Minutes",
      focus: guidance.headline,
      intensity: (ctx.bmi && ctx.bmi >= 28) ? "Low-Impact Functional" : "Progressive Dynamic",
    },
    hydrationStatus: {
      currentMl: ctx.todayWaterMl,
      targetMl: ctx.waterTargetMl,
      percentage: waterPct,
      statusText: waterPct >= 100 ? "Goal met! Stellar hydration." : `${ctx.waterTargetMl - ctx.todayWaterMl}ml remaining today`,
    },
    wellnessRecommendation: {
      action: ctx.todayStress && ctx.todayStress >= 4 ? "4-4-4-4 Box Breathing" : "5-Min Centering Meditation",
      technique: "Vagus nerve modulation & parasympathetic activation",
      rationale: guidance.mindfulnessTip,
    },
    nutritionAdvice: {
      calorieTarget: ctx.targetCalories ? `~${ctx.targetCalories.toLocaleString()} kcal/day` : "Calibrate in Profile",
      macroFocus: ctx.fitnessGoal === "muscle_gain" ? "High Protein & Complex Carbs" : "Fiber, Lean Protein & Whole Foods",
      practicalTip: guidance.calorieAdvice,
    },
    recoveryScore: {
      status: recoveryStatus,
      advice: recoveryAdvice,
    },
    nextBestAction,
  };
}

/**
 * Intelligent Conversational Assistant:
 * Analyzes the user's inquiry, incorporates their exact biometrics and training history,
 * applies medical safety filters, and outputs tailored, encouraging guidance.
 */
export async function generateSmartCoachResponse(
  ctx: CoachUserContext,
  userMessage: string
): Promise<string> {
  const query = userMessage.toLowerCase().trim();

  // =========================================================================
  // PRIORITY 1 — SAFETY & CLINICAL INTERCEPT
  // =========================================================================
  const redFlags = [
    "chest pain", "heart attack", "shortness of breath", "severe injury",
    "fracture", "prescribe", "medication", "cure cancer", "suicide", "diagnose disease",
    "severe depression", "dosage", "steroid"
  ];

  if (redFlags.some((flag) => query.includes(flag))) {
    return (
      "⚠️ **Important Safety Notice**: I am your SmartFit wellness and fitness coach, not a medical doctor or clinical healthcare provider. " +
      "I cannot diagnose conditions, prescribe medication, or treat acute medical symptoms. " +
      "If you are experiencing acute pain, severe dizziness, chest discomfort, or medical distress, please stop exercising immediately and contact emergency medical services or a licensed healthcare professional."
    );
  }

  // =========================================================================
  // PRIORITY 2 — DIRECT GENERAL KNOWLEDGE ANSWERS
  // (BMI vs body fat, progressive overload, sleep importance, BMR, TDEE, etc.)
  // Evaluated BEFORE generic keyword matching so questions like "Does BMI is correct
  // measure to know fat levels in human body?" receive direct educational answers.
  // =========================================================================
  const generalKnowledge = matchGeneralKnowledge(query);
  if (generalKnowledge) {
    // If it's a general water intake inquiry and user has a profile with a water target, append a helpful personalized note!
    if (generalKnowledge.topic === "Daily Water Intake" && ctx.waterTargetMl) {
      return (
        `${generalKnowledge.answer}\n\n` +
        `💡 *Based on your calibrated SmartFit profile, your personal daily target is **${ctx.waterTargetMl.toLocaleString()} ml** (currently **${ctx.todayWaterMl} ml** logged today).*`
      );
    }
    return generalKnowledge.answer;
  }

  // =========================================================================
  // PRIORITY 3 — PERSONALIZED INQUIRIES (Using Profile Context When Relevant)
  // =========================================================================

  // 3.1 Personalized BMI inquiries (e.g. "My BMI is 29. What does it mean?", "What does my BMI mean?")
  if (
    /\bmy bmi\b/i.test(query) ||
    /\bwhat does my bmi mean\b/i.test(query) ||
    /\binterpret my bmi\b/i.test(query) ||
    /\bbased on my bmi\b/i.test(query)
  ) {
    const userBmi = ctx.bmi ? ctx.bmi.toFixed(1) : "N/A";
    const userCat = ctx.bmiCategory ? ctx.bmiCategory.replace(/_/g, " ") : "Normal";
    const weight = ctx.weightKg ? `${ctx.weightKg} kg` : "N/A";
    const height = ctx.heightCm ? `${ctx.heightCm} cm` : "N/A";

    return (
      `⚖️ **Personalized BMI Interpretation for ${ctx.username}**:\n\n` +
      `• **Your Screening BMI**: **${userBmi}** (${userCat.toUpperCase()}) based on ${height} and ${weight}.\n` +
      `• **What This Means**:\n` +
      `  - BMI is a statistical screening ratio of weight to height, **not** an exact measurement of body fat.\n` +
      `  - If you engage in resistance training, your higher muscle mass may place you in an elevated category without excess fat.\n` +
      `  - If you are seeking healthy weight management, combine progressive functional movement with whole-food caloric balance.\n` +
      `• **Tailored Recommendation**: Focus on waist-to-height ratio, strength progression, and consistent hydration (${ctx.todayWaterMl}/${ctx.waterTargetMl} ml today) rather than fixating on the scale alone.`
    );
  }

  // 3.2 Personalized Workout & Training Routine Inquiries
  // (e.g. "What exercises should I do today for muscle hypertrophy?", "What workout should I do?", "Suggest a workout routine")
  if (
    query.includes("workout") ||
    query.includes("exercise") ||
    query.includes("routine") ||
    query.includes("training") ||
    query.includes("sets") ||
    query.includes("reps") ||
    query.includes("hypertrophy")
  ) {
    const goalText = ctx.fitnessGoal ? ctx.fitnessGoal.replace(/_/g, " ") : "general health";
    const bmiSafeNote = (ctx.bmi && ctx.bmi >= 28)
      ? "\n\n💡 *Joint Safety Adaptation*: Because your screening BMI is elevated, focus on controlled, low-impact movements (Step Jacks instead of jump squats, elevated push-ups) to protect joint cartilage."
      : "";

    return (
      `Here is your personalized workout strategy based on your **${goalText.toUpperCase()}** goal:\n\n` +
      `• **Recommended Split**: 3 to 4 circuits of compound functional movements (Bodyweight Squats, Push-Ups / Incline Presses, Glute Bridges, Plank Holds).\n` +
      `• **Volume**: 8–12 reps per movement with 45–60 seconds rest between sets.\n` +
      `• **Target Heart Rate**: Keep your heart rate in Zone 2 to 3 for aerobic conditioning.\n` +
      `• **Status**: ${ctx.todayWorkoutDone ? `You have already logged a session today (${ctx.recentWorkoutTitle || "Routine"}). Great consistency!` : "No workout logged yet today. Head over to the Fitness page to track your session and claim +100 XP!"}` +
      bmiSafeNote
    );
  }

  // 3.3 Personalized Nutrition & Calorie Inquiries
  // (e.g. "How many calories should I eat and how is my water intake?", "What should I eat today?")
  if (
    query.includes("diet") ||
    query.includes("food") ||
    query.includes("nutrition") ||
    query.includes("calorie") ||
    query.includes("meal") ||
    query.includes("snack") ||
    /\b(eat|eating|eats)\b/i.test(query)
  ) {
    const calTarget = ctx.targetCalories ? `${Math.round(ctx.targetCalories).toLocaleString()} kcal/day` : "2,000–2,200 kcal/day";
    return (
      `🥗 **Personalized Wholesome Nutrition Guidance**:\n\n` +
      `• **Daily Energy Target**: ~${calTarget} based on your age (${ctx.age || "N/A"}) and activity level (${ctx.activityLevel?.replace(/_/g, " ") || "moderate"}).\n` +
      `• **Hydration Status**: Daily target of ~${ctx.waterTargetMl.toLocaleString()} ml (current progress: ${ctx.todayWaterMl} ml logged).\n` +
      `• **Macronutrient Balance**: Focus on high-satiety lean protein (tofu, lentils, poultry, eggs), slow-burning complex carbs (oats, brown rice, quinoa), and healthy fats (avocado, nuts, olive oil).\n` +
      `• **Pre-Workout Fuel**: A banana with almond butter or a light oatmeal bowl 45 minutes before training.\n` +
      `• **Post-Workout Recovery**: 20–30g of protein paired with hydration within 60 minutes.\n\n` +
      `*Disclaimer: Nutritional guidelines are general wellness estimates and not clinical dietetic prescriptions.*`
    );
  }

  // 3.4 Personalized Hydration Status
  if (query.includes("water") || query.includes("hydrat") || query.includes("drink")) {
    const remaining = Math.max(0, ctx.waterTargetMl - ctx.todayWaterMl);
    return (
      `💧 **Hydration Status for ${ctx.username}**:\n\n` +
      `• **Logged Today**: ${ctx.todayWaterMl} ml / ${ctx.waterTargetMl} ml (${Math.min(100, Math.round((ctx.todayWaterMl / ctx.waterTargetMl) * 100))}%)\n` +
      (remaining === 0
        ? "• **Goal Achieved**: You have already hit your daily water target! Maintain sipping to stay fresh."
        : `• **Remaining Target**: ${remaining} ml left to reach your goal.\n• **Coaching Tip**: Sip 250ml every 60–90 minutes rather than chugging large amounts at once. Reaching your goal earns +30 XP!`)
    );
  }

  // 3.5 Personalized Stress, Sleep & Mental Wellness
  if (
    query.includes("stress") ||
    query.includes("anxious") ||
    query.includes("calm") ||
    query.includes("breath") ||
    query.includes("meditat") ||
    query.includes("sleep") ||
    query.includes("mudra") ||
    query.includes("relax") ||
    query.includes("tense")
  ) {
    return (
      `🌿 **Mindfulness & Autonomic Reset Recommendation**:\n\n` +
      `• **Box Breathing (4-4-4-4)**: Inhale for 4 seconds, hold for 4, exhale smoothly for 4, and hold for 4. Practice 4 cycles to activate the parasympathetic vagus nerve.\n` +
      `• **Yogic Mudra**: Practice **Vayu Mudra** (fold index finger to base of thumb) to soothe anxious thoughts, or **Gyan Mudra** for mental clarity.\n` +
      `• **Current Stress State**: ${ctx.todayStress ? `You rated your stress at ${ctx.todayStress}/5 today.` : "Log your daily check-in on the /wellness dashboard to receive tailored breathing exercises."}\n` +
      `• Practicing on the Wellness or Meditation page rewards you with +30 to +50 XP and maintains your streak!`
    );
  }

  // 3.6 Personalized Chess & Cognitive Training
  if (query.includes("chess") || query.includes("brain") || query.includes("cognitive") || query.includes("puzzle")) {
    return (
      `♟️ **Cognitive Fitness & Tactical Planning**:\n\n` +
      `• **Current Chess ELO**: ${ctx.chessElo} (${ctx.chessGamesCount} games recorded on SmartFit).\n` +
      `• **Mental Agility High Score**: ${ctx.cognitiveBestScore} pts in brain mini-games.\n` +
      `• **Tactical Advice**: Before executing an attacking move, identify your opponent's checks, captures, and threats (CCT principle). Practice calculating 2 moves ahead.\n` +
      `• Complete today's Back-Rank Tactical Drill in the Chess Arena to earn +40 XP!`
    );
  }

  // =========================================================================
  // PRIORITY 4 — EXPLICIT PROFILE & JOURNEY SUMMARY REQUEST
  // (Only when explicitly asked for summary/profile/journey/streak stats)
  // =========================================================================
  if (isExplicitProfileSummaryRequest(query)) {
    return (
      `🏆 **SmartFit Profile & Journey Summary for ${ctx.username}**:\n\n` +
      `• **Level**: Level ${ctx.currentLevel} (${ctx.totalXP.toLocaleString()} Lifetime XP)\n` +
      `• **Consistency Streak**: ${ctx.currentStreak} Days Consistent 🔥\n` +
      `• **Today's Workout**: ${ctx.todayWorkoutDone ? "✅ Completed" : "⏳ Pending"}\n` +
      `• **Today's Wellness Check-In**: ${ctx.todayWellnessDone ? "✅ Logged" : "⏳ Pending"}\n` +
      `• **Hydration**: ${ctx.todayWaterMl} / ${ctx.waterTargetMl} ml (${Math.round((ctx.todayWaterMl / ctx.waterTargetMl) * 100)}%)\n\n` +
      `Keep compounding small daily habits — each completed activity advances your challenges and climbs the global leaderboard!`
    );
  }

  // =========================================================================
  // PRIORITY 5 — OUT-OF-DOMAIN QUESTIONS
  // =========================================================================
  if (isOutOfDomainQuery(query)) {
    return generateOutOfDomainResponse();
  }

  // =========================================================================
  // DEFAULT RECEPTIVE COACHING GUIDANCE
  // =========================================================================
  return (
    `Hello ${ctx.username}! As your SmartFit AI Coach, I'm here to support your fitness, nutrition, recovery, and cognitive goals.\n\n` +
    `• **Your Current Goal**: ${ctx.fitnessGoal ? ctx.fitnessGoal.replace(/_/g, " ").toUpperCase() : "General Vitality"}\n` +
    `• **Today's Action Focus**: ${!ctx.todayWorkoutDone ? "Try tracking a workout on the /fitness page (+100 XP) or checking your squat form with the AI Camera Coach." : !ctx.todayWellnessDone ? "Take 2 minutes for a mindful check-in or box breathing on /wellness (+25 XP)." : "Great job hitting your targets today! Stay hydrated and try a tactical chess puzzle."}\n\n` +
    `Feel free to ask me anything about exercise science (e.g. *"What is progressive overload?"*), body metrics (*"Does BMI measure body fat?"*), nutrition, hydration, or stress-relief breathwork!`
  );
}
