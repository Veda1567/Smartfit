/**
 * SmartFit Mental Wellness & Mindfulness Engine
 * Provides non-medical self-care recommendations, guided breathwork configurations,
 * daily wellness check-in validation, and stress-modulation routines.
 */

export type MoodType = "great" | "good" | "okay" | "low" | "stressed";
export type SleepQualityType = "excellent" | "good" | "fair" | "poor";

export interface WellnessCheckInInput {
  mood?: string | null;
  stressLevel?: number | null;
  energyLevel?: number | null;
  sleepQuality?: string | null;
  notes?: string | null;
}

export interface WellnessCheckInValidationResult {
  values: {
    mood: MoodType;
    stressLevel: number;
    energyLevel: number;
    sleepQuality: SleepQualityType;
    notes?: string;
  };
  errors: Record<string, string>;
}

const VALID_MOODS: readonly MoodType[] = ["great", "good", "okay", "low", "stressed"];
const VALID_SLEEP: readonly SleepQualityType[] = ["excellent", "good", "fair", "poor"];

export function validateWellnessCheckIn(
  input: WellnessCheckInInput
): WellnessCheckInValidationResult {
  const errors: Record<string, string> = {};

  let mood: MoodType = "okay";
  if (input.mood && VALID_MOODS.includes(input.mood as MoodType)) {
    mood = input.mood as MoodType;
  } else if (input.mood) {
    errors.mood = "Please select a valid mood option.";
  }

  const stressRaw = Number(input.stressLevel);
  let stressLevel = 3;
  if (!isNaN(stressRaw) && stressRaw >= 1 && stressRaw <= 5) {
    stressLevel = Math.round(stressRaw);
  } else if (input.stressLevel !== undefined && input.stressLevel !== null) {
    errors.stressLevel = "Stress level must be between 1 and 5.";
  }

  const energyRaw = Number(input.energyLevel);
  let energyLevel = 3;
  if (!isNaN(energyRaw) && energyRaw >= 1 && energyRaw <= 5) {
    energyLevel = Math.round(energyRaw);
  } else if (input.energyLevel !== undefined && input.energyLevel !== null) {
    errors.energyLevel = "Energy level must be between 1 and 5.";
  }

  let sleepQuality: SleepQualityType = "good";
  if (input.sleepQuality && VALID_SLEEP.includes(input.sleepQuality as SleepQualityType)) {
    sleepQuality = input.sleepQuality as SleepQualityType;
  } else if (input.sleepQuality) {
    errors.sleepQuality = "Please select a valid sleep quality option.";
  }

  let notes: string | undefined = undefined;
  if (input.notes && typeof input.notes === "string") {
    notes = input.notes.trim().slice(0, 280);
  }

  return {
    values: {
      mood,
      stressLevel,
      energyLevel,
      sleepQuality,
      notes,
    },
    errors,
  };
}

export interface WellnessRecommendation {
  primaryHeadline: string;
  supportiveMessage: string;
  recommendedBreathing: {
    title: string;
    pattern: "box" | "4-7-8";
    durationMinutes: number;
    description: string;
  };
  recommendedMeditation: {
    title: string;
    sessionType: "mindfulness" | "relaxation" | "sleep" | "focus";
    durationMinutes: number;
    description: string;
  };
  recommendedMudra: {
    name: string;
    key: "gyan" | "prana" | "vayu" | "shunya" | "surya";
    benefit: string;
    duration: string;
  };
  lifestyleTip: string;
  isHighDistress: boolean;
  crisisSupportNotice?: string;
  nonMedicalDisclaimer: string;
}

const WELLNESS_DISCLAIMER =
  "Wellness Suggestion: These practices are general self-care and relaxation exercises designed to support daily well-being. They are not medical, psychological, or clinical treatments. If you are experiencing clinical anxiety, depression, or a mental health crisis, please consult a qualified healthcare provider.";

export const CRISIS_SUPPORT_NOTICE =
  "Compassionate Support: If you are feeling overwhelmed, experiencing acute distress, or having thoughts of harming yourself, please reach out for immediate assistance. You are not alone. Contact a healthcare provider, a trusted loved one, or a free confidential 24/7 helpline (US/Canada: call or text 988; UK: call 111; India: call 9152987821 or 14416).";

/**
 * Generates personalized, safe self-care recommendations based on check-in state.
 */
export function getPersonalizedWellnessRecommendations(params: {
  mood?: string | null;
  stressLevel?: number | null;
  energyLevel?: number | null;
  sleepQuality?: string | null;
  fitnessGoal?: string | null;
}): WellnessRecommendation {
  const stress = params.stressLevel ?? 3;
  const energy = params.energyLevel ?? 3;
  const mood = params.mood ?? "okay";
  const sleep = params.sleepQuality ?? "good";

  const isHighDistress = stress >= 5 && (mood === "stressed" || mood === "low");

  // High Stress / Overwhelm Pattern
  if (stress >= 4 || mood === "stressed") {
    return {
      primaryHeadline: "Calm & Down-Regulate Sympathetic Tone",
      supportiveMessage:
        "When tension runs high, the body activates sympathetic fight-or-flight circuits. You may find gentle rhythmic breathing and restorative mindfulness helpful to return to baseline calm.",
      recommendedBreathing: {
        title: "Box Breathing 4-4-4-4",
        pattern: "box",
        durationMinutes: 4,
        description: "Equalized breath holds to stabilize heart rate variability and gently settle acute tension.",
      },
      recommendedMeditation: {
        title: "Body Scan for Stress Release",
        sessionType: "relaxation",
        durationMinutes: 10,
        description: "Systematically unclench jaw, shoulders, and abdomen to melt physical stress holding patterns.",
      },
      recommendedMudra: {
        name: "Vayu Mudra (Mudra of Air & Ease)",
        key: "vayu",
        benefit: "Traditional posture to release restlessness and calm chaotic mental currents.",
        duration: "10–15 min",
      },
      lifestyleTip: "Step away from screens for 15 minutes and take a gentle, unhurried walk in fresh air.",
      isHighDistress,
      crisisSupportNotice: isHighDistress ? CRISIS_SUPPORT_NOTICE : undefined,
      nonMedicalDisclaimer: WELLNESS_DISCLAIMER,
    };
  }

  // Poor Sleep / Evening Unwind Pattern
  if (sleep === "poor") {
    return {
      primaryHeadline: "Restorative Evening & Sleep Readiness",
      supportiveMessage:
        "Quality sleep is the bedrock of neuro-muscular recovery. You may find evening parasympathetic pacing and blue-light reduction helpful for deeper rest.",
      recommendedBreathing: {
        title: "4-7-8 Relaxing Breathwork",
        pattern: "4-7-8",
        durationMinutes: 5,
        description: "Lengthened exhales naturally signal the vagus nerve that it is safe to down-shift into sleep.",
      },
      recommendedMeditation: {
        title: "Deep Sleep & Evening Unwind",
        sessionType: "sleep",
        durationMinutes: 15,
        description: "A soothing soundscape journey to transition the brain into delta and theta restorative waves.",
      },
      recommendedMudra: {
        name: "Shunya Mudra (Mudra of Quiet Stillness)",
        key: "shunya",
        benefit: "Cultivates inner quietude and settles mental rumination before bedtime.",
        duration: "10 min",
      },
      lifestyleTip: "Dim ambient lighting 60 minutes before bed and avoid caffeinated beverages past midday.",
      isHighDistress: false,
      nonMedicalDisclaimer: WELLNESS_DISCLAIMER,
    };
  }

  // Low Energy / Drained Pattern
  if (energy <= 2 || mood === "low") {
    return {
      primaryHeadline: "Gentle Rejuvenation & Vitality Awakening",
      supportiveMessage:
        "When energy is depleted, avoid harsh stimulation. Gentle posture, intentional oxygenation, and compassionate pacing help renew vital reserves without burnout.",
      recommendedBreathing: {
        title: "Energizing Diaphragmatic Breath",
        pattern: "box",
        durationMinutes: 3,
        description: "Deep belly inhales to oxygenate your bloodstream and dispel sluggish mental fog.",
      },
      recommendedMeditation: {
        title: "Cognitive Focus & Centering",
        sessionType: "focus",
        durationMinutes: 5,
        description: "A short, uplifting centering practice to restore mental clarity without fatigue.",
      },
      recommendedMudra: {
        name: "Prana Mudra (Mudra of Vital Life-Force)",
        key: "prana",
        benefit: "Awakens internal vibrancy, reduces physical lethargy, and sharpens visual alertness.",
        duration: "15 min",
      },
      lifestyleTip: "Drink a tall glass of cool water and enjoy 5 minutes of natural sunlight to reset circadian receptors.",
      isHighDistress,
      crisisSupportNotice: isHighDistress ? CRISIS_SUPPORT_NOTICE : undefined,
      nonMedicalDisclaimer: WELLNESS_DISCLAIMER,
    };
  }

  // High Vitality & Good Mood Pattern
  if (energy >= 4 && (mood === "great" || mood === "good")) {
    return {
      primaryHeadline: "Deep Mindfulness & Sustained Focus",
      supportiveMessage:
        "Your energy and mood are steady and receptive. This is an ideal window for deep mindfulness meditation and cognitive training.",
      recommendedBreathing: {
        title: "Box Breathing Focus",
        pattern: "box",
        durationMinutes: 5,
        description: "Sharpens attentional control and primes the mind for high-level creative work or chess play.",
      },
      recommendedMeditation: {
        title: "Mindfulness of Breath",
        sessionType: "mindfulness",
        durationMinutes: 10,
        description: "Cultivate present-moment awareness by observing thoughts without attachment or judgment.",
      },
      recommendedMudra: {
        name: "Gyan Mudra (Mudra of Wisdom & Clarity)",
        key: "gyan",
        benefit: "Classic seated posture to anchor mental stillness and deepen introspective focus.",
        duration: "15–20 min",
      },
      lifestyleTip: "Channel this clear vitality into an engaging creative session or a physical fitness workout.",
      isHighDistress: false,
      nonMedicalDisclaimer: WELLNESS_DISCLAIMER,
    };
  }

  // General Balanced Self-Care (Default)
  return {
    primaryHeadline: "Balanced Daily Wellness & Self-Care",
    supportiveMessage:
      "A balanced mind supports a strong body. Keep your nervous system resilient with daily rhythmic breathing, grounding hand postures, and restorative pauses.",
    recommendedBreathing: {
      title: "Box Breathing Focus",
      pattern: "box",
      durationMinutes: 4,
      description: "Equal 4-count inhale, hold, exhale, hold for balanced autonomic stability.",
    },
    recommendedMeditation: {
      title: "Mindfulness of Breath",
      sessionType: "mindfulness",
      durationMinutes: 10,
      description: "Anchor attention onto the natural rhythm of your breath to quiet everyday chatter.",
    },
    recommendedMudra: {
      name: "Gyan Mudra (Mudra of Knowledge)",
      key: "gyan",
      benefit: "Sustains mental equilibrium and grounds body posture during quiet reflection.",
      duration: "10–15 min",
    },
    lifestyleTip: "Take two 3-minute breath breaks today to pause and check in with your posture and hydration.",
    isHighDistress: false,
    nonMedicalDisclaimer: WELLNESS_DISCLAIMER,
  };
}

export interface DailyWellnessRoutineItem {
  id: string;
  timeOfDay: "Morning" | "Midday" | "Evening" | "Night";
  title: string;
  duration: string;
  description: string;
  actionUrl: string;
  actionLabel: string;
}

export const DAILY_WELLNESS_ROUTINE: DailyWellnessRoutineItem[] = [
  {
    id: "morning_vitality",
    timeOfDay: "Morning",
    title: "Morning Sun & Prana Awakening",
    duration: "5 min",
    description: "Start your day with 5 minutes of mindful Prana Mudra and a tall glass of water (250ml) to awaken alertness.",
    actionUrl: "/mudras",
    actionLabel: "Practice Mudra",
  },
  {
    id: "midday_reset",
    timeOfDay: "Midday",
    title: "Midday Box Breathing Desk Reset",
    duration: "4 min",
    description: "Pause halfway through your work day for 4 cycles of Box Breathing to release tension in neck and shoulders.",
    actionUrl: "/wellness#breathing",
    actionLabel: "Start Breathwork",
  },
  {
    id: "evening_movement",
    timeOfDay: "Evening",
    title: "Movement & Hydration Check",
    duration: "20–30 min",
    description: "Connect your physical fitness session or light walk with conscious breathing and water hydration tracking.",
    actionUrl: "/fitness",
    actionLabel: "Open Fitness",
  },
  {
    id: "night_unwind",
    timeOfDay: "Night",
    title: "4-7-8 Deep Sleep Wind-Down",
    duration: "10 min",
    description: "Dim screens, practice 5 minutes of 4-7-8 relaxing breathing, and listen to rain soundscapes before sleep.",
    actionUrl: "/meditation",
    actionLabel: "Start Meditation",
  },
];
