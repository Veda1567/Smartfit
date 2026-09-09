export type ExerciseDetail = {
  name: string;
  category: "chest" | "legs" | "core" | "back" | "cardio" | "stretch";
  sets: number;
  reps?: string;
  duration?: string;
  durationSec?: number;
  restSec: number;
  instructions: string;
};

export type WorkoutDayRoutine = {
  dayNumber: number;
  dayTitle: string;
  focus: string;
  estimatedDurationMin: number;
  estimatedCalories: number;
  exercises: ExerciseDetail[];
};

export type WorkoutRegimen = {
  goalKey: string;
  goalTitle: string;
  frequency: string;
  description: string;
  routines: WorkoutDayRoutine[];
};

const REGIMENS_DATA: Record<string, WorkoutRegimen> = {
  weight_loss: {
    goalKey: "weight_loss",
    goalTitle: "Weight & Fat Loss",
    frequency: "3–4 Days / Week",
    description: "High-metabolic bodyweight and aerobic conditioning to maximize caloric expenditure while preserving lean muscle.",
    routines: [
      {
        dayNumber: 1,
        dayTitle: "Day 1: Full-Body Metabolic Circuit",
        focus: "Full Body Resistance & Caloric Burn",
        estimatedDurationMin: 25,
        estimatedCalories: 230,
        exercises: [
          {
            name: "Dynamic Jumping Jacks & Arm Hugs",
            category: "cardio",
            sets: 2,
            duration: "2 min",
            durationSec: 120,
            restSec: 30,
            instructions: "Warm up shoulder joints and elevate heart rate at a steady, rhythmic pace.",
          },
          {
            name: "Bodyweight Air Squats",
            category: "legs",
            sets: 3,
            reps: "15 reps",
            restSec: 45,
            instructions: "Chest upright, push knees outwards in line with toes, sit back into hips.",
          },
          {
            name: "Incline or Floor Push-ups",
            category: "chest",
            sets: 3,
            reps: "10–12 reps",
            restSec: 45,
            instructions: "Maintain a straight plank line from head to heels; brace abdominal core.",
          },
          {
            name: "Alternating Mountain Climbers",
            category: "cardio",
            sets: 3,
            reps: "20 reps (10/side)",
            restSec: 40,
            instructions: "Drive knees toward chest smoothly without letting hips bounce up.",
          },
          {
            name: "Elbow Plank Hold",
            category: "core",
            sets: 3,
            duration: "35 sec",
            durationSec: 35,
            restSec: 45,
            instructions: "Squeeze glutes, tuck pelvis under slightly, breathe evenly through nose.",
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Day 2: Aerobic Tempo & Core Stamina",
        focus: "Cardiovascular Endurance & Abdominals",
        estimatedDurationMin: 28,
        estimatedCalories: 260,
        exercises: [
          {
            name: "High Knees in Place",
            category: "cardio",
            sets: 3,
            duration: "45 sec",
            durationSec: 45,
            restSec: 30,
            instructions: "Pump arms synchronously, landing softly on the balls of your feet.",
          },
          {
            name: "Bicycle Crunches",
            category: "core",
            sets: 3,
            reps: "16 reps (8/side)",
            restSec: 40,
            instructions: "Slow, controlled rotation; connect elbow toward opposite knee with full extension.",
          },
          {
            name: "Forward Lunges",
            category: "legs",
            sets: 3,
            reps: "12 reps (6/leg)",
            restSec: 45,
            instructions: "Keep torso vertical; front knee should track directly above ankle.",
          },
          {
            name: "Burpees (Low-Impact Option Available)",
            category: "cardio",
            sets: 3,
            reps: "8 reps",
            restSec: 60,
            instructions: "Drop palms to floor, step or jump back to plank, return and jump upright.",
          },
        ],
      },
      {
        dayNumber: 3,
        dayTitle: "Day 3: Lower Body & Core Conditioning",
        focus: "Legs, Glutes & Postural Stability",
        estimatedDurationMin: 25,
        estimatedCalories: 215,
        exercises: [
          {
            name: "Glute Bridges",
            category: "legs",
            sets: 3,
            reps: "15 reps",
            restSec: 40,
            instructions: "Drive through heels, squeeze glutes at the top for 2 seconds.",
          },
          {
            name: "Side Plank Hold",
            category: "core",
            sets: 2,
            duration: "25 sec / side",
            durationSec: 25,
            restSec: 30,
            instructions: "Keep body straight; lift top hip upward away from the mat.",
          },
          {
            name: "Squat Pulses",
            category: "legs",
            sets: 3,
            duration: "30 sec",
            durationSec: 30,
            restSec: 45,
            instructions: "Stay in bottom half of squat range to maximize time under tension.",
          },
          {
            name: "Bird-Dog Extensions",
            category: "back",
            sets: 3,
            reps: "12 reps (6/side)",
            restSec: 35,
            instructions: "Reach opposite arm and leg straight out without arching lower back.",
          },
        ],
      },
    ],
  },
  muscle_gain: {
    goalKey: "muscle_gain",
    goalTitle: "Strength & Muscle Tone",
    frequency: "3–4 Days / Week",
    description: "Progressive bodyweight resistance and time-under-tension focus designed to stimulate muscle protein synthesis.",
    routines: [
      {
        dayNumber: 1,
        dayTitle: "Day 1: Upper Body Push & Pull Power",
        focus: "Chest, Back, Shoulders & Triceps",
        estimatedDurationMin: 30,
        estimatedCalories: 240,
        exercises: [
          {
            name: "Tempo Push-ups (3 sec eccentric)",
            category: "chest",
            sets: 4,
            reps: "10–12 reps",
            restSec: 60,
            instructions: "Lower your chest slowly over 3 seconds, explode up powerfully.",
          },
          {
            name: "Pike Push-ups (Shoulder Focus)",
            category: "chest",
            sets: 3,
            reps: "8–10 reps",
            restSec: 60,
            instructions: "Hips high in downward dog shape; lower top of head toward the floor.",
          },
          {
            name: "Chair or Bench Dips",
            category: "chest",
            sets: 3,
            reps: "12 reps",
            restSec: 45,
            instructions: "Keep back close to bench edge; lower elbows to 90 degrees.",
          },
          {
            name: "Superman Back Extensions",
            category: "back",
            sets: 3,
            reps: "12 reps with 2s hold",
            restSec: 45,
            instructions: "Lie prone, lift chest and thighs simultaneously, engage lats and glutes.",
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Day 2: Lower Body Hypertrophy & Stability",
        focus: "Quads, Hamstrings & Calves",
        estimatedDurationMin: 32,
        estimatedCalories: 260,
        exercises: [
          {
            name: "Bulgarian Split Squats",
            category: "legs",
            sets: 3,
            reps: "10 reps / leg",
            restSec: 60,
            instructions: "Rear foot elevated on chair; descend until front thigh is parallel.",
          },
          {
            name: "Close-Stance Goblet/Air Squats",
            category: "legs",
            sets: 4,
            reps: "15 reps",
            restSec: 60,
            instructions: "Target vastus lateralis quad sweep; control descent smoothly.",
          },
          {
            name: "Single-Leg Glute Bridges",
            category: "legs",
            sets: 3,
            reps: "10 reps / leg",
            restSec: 45,
            instructions: "Isolate hamstrings and gluteus maximus without hip tilting.",
          },
          {
            name: "Wall Sit Hold",
            category: "legs",
            sets: 3,
            duration: "45 sec",
            durationSec: 45,
            restSec: 60,
            instructions: "Back flat against wall, knees at strict 90-degree right angle.",
          },
        ],
      },
      {
        dayNumber: 3,
        dayTitle: "Day 3: Core Armor & Functional Calisthenics",
        focus: "Abs, Obliques & Posterior Chain",
        estimatedDurationMin: 25,
        estimatedCalories: 200,
        exercises: [
          {
            name: "Hollow Body Hold",
            category: "core",
            sets: 3,
            duration: "30 sec",
            durationSec: 30,
            restSec: 45,
            instructions: "Press lower back firmly into floor; arms and legs extended.",
          },
          {
            name: "Hanging/Lying Leg Raises",
            category: "core",
            sets: 3,
            reps: "12 reps",
            restSec: 45,
            instructions: "Lift legs smoothly using lower abdominals without swinging.",
          },
          {
            name: "Plank Shoulder Taps",
            category: "core",
            sets: 3,
            reps: "20 taps total",
            restSec: 45,
            instructions: "Resist rotational torque; keep hips completely square to the ground.",
          },
        ],
      },
    ],
  },
  endurance: {
    goalKey: "endurance",
    goalTitle: "Cardiovascular Endurance",
    frequency: "3–4 Days / Week",
    description: "Sustained aerobic conditioning and fast-twitch interval pacing to increase VO2 max and stamina.",
    routines: [
      {
        dayNumber: 1,
        dayTitle: "Day 1: Continuous Interval Aerobics",
        focus: "Heart Rate Modulation & Aerobic Capacity",
        estimatedDurationMin: 30,
        estimatedCalories: 280,
        exercises: [
          {
            name: "Boxer Bounce & Footwork Drills",
            category: "cardio",
            sets: 3,
            duration: "60 sec",
            durationSec: 60,
            restSec: 30,
            instructions: "Light rhythmic hopping side to side, keeping calves engaged.",
          },
          {
            name: "Speed Squat to Calf Raise",
            category: "legs",
            sets: 3,
            reps: "20 reps",
            restSec: 35,
            instructions: "Smooth rapid transition from full squat to high calf extension.",
          },
          {
            name: "Alternating Step-back Lunges",
            category: "legs",
            sets: 3,
            reps: "16 reps",
            restSec: 40,
            instructions: "Fluid, non-stop leg alternation with continuous controlled breathing.",
          },
          {
            name: "Bear Crawl Hold & Steps",
            category: "core",
            sets: 3,
            duration: "40 sec",
            durationSec: 40,
            restSec: 45,
            instructions: "Knees hovering 2 inches off the ground; steady core brace.",
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Day 2: High-Density HIIT Intervals",
        focus: "Threshold Training & Rapid Recovery",
        estimatedDurationMin: 28,
        estimatedCalories: 290,
        exercises: [
          {
            name: "Speed Skaters (Lateral Hops)",
            category: "cardio",
            sets: 4,
            duration: "40 sec",
            durationSec: 40,
            restSec: 30,
            instructions: "Hop laterally from one foot to the other, absorbing impact with knees bent.",
          },
          {
            name: "Plank Jacks",
            category: "cardio",
            sets: 3,
            duration: "40 sec",
            durationSec: 40,
            restSec: 30,
            instructions: "Jump feet out and in while maintaining solid upper body plank.",
          },
          {
            name: "Flutter Kicks",
            category: "core",
            sets: 3,
            duration: "45 sec",
            durationSec: 45,
            restSec: 30,
            instructions: "Keep lower back down; small rapid scissor kicks 6 inches off ground.",
          },
        ],
      },
    ],
  },
  flexibility: {
    goalKey: "flexibility",
    goalTitle: "Flexibility & Mobility",
    frequency: "2–3 Days / Week",
    description: "Active range-of-motion flows, joint decompression, and yogic posture holds for injury resilience.",
    routines: [
      {
        dayNumber: 1,
        dayTitle: "Day 1: Hip Openers & Spinal Decompression",
        focus: "Pelvic Mobility & Thoracic Rotation",
        estimatedDurationMin: 22,
        estimatedCalories: 120,
        exercises: [
          {
            name: "Cat-Cow Dynamic Spinal Flow",
            category: "stretch",
            sets: 2,
            duration: "90 sec",
            durationSec: 90,
            restSec: 20,
            instructions: "Inhale arch spine looking up; exhale round spine pulling navel to spine.",
          },
          {
            name: "World's Greatest Stretch (Lunge + T-Spine)",
            category: "stretch",
            sets: 2,
            reps: "6 reps / side",
            restSec: 30,
            instructions: "Deep runner's lunge, rotate chest open toward front knee, reach skyward.",
          },
          {
            name: "Pigeon Pose Hip Opener",
            category: "stretch",
            sets: 2,
            duration: "45 sec / side",
            durationSec: 45,
            restSec: 30,
            instructions: "Fold gently over bent shin, breathing deeply into tight gluteal muscles.",
          },
          {
            name: "Extended Child's Pose",
            category: "stretch",
            sets: 2,
            duration: "60 sec",
            durationSec: 60,
            restSec: 20,
            instructions: "Sink hips to heels, walk fingertips forward, relax forehead on mat.",
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Day 2: Full Body Joint Freedom",
        focus: "Hamstrings, Calves & Shoulders",
        estimatedDurationMin: 20,
        estimatedCalories: 110,
        exercises: [
          {
            name: "Downward-Facing Dog to Cobra Flow",
            category: "stretch",
            sets: 3,
            reps: "6 smooth flows",
            restSec: 30,
            instructions: "Press heels down into mat; swoop forward smoothly into gentle backbend.",
          },
          {
            name: "Standing Hamstring Scoop & Reach",
            category: "stretch",
            sets: 2,
            reps: "8 reps / leg",
            restSec: 20,
            instructions: "Heel planted with toes up; hinge at hips and scoop hands down toward toes.",
          },
          {
            name: "Overhead Shoulder & Triceps Stretch",
            category: "stretch",
            sets: 2,
            duration: "30 sec / side",
            durationSec: 30,
            restSec: 20,
            instructions: "Gently guide elbow behind head; breathe into chest expansion.",
          },
        ],
      },
    ],
  },
  maintenance: {
    goalKey: "maintenance",
    goalTitle: "Healthy Maintenance",
    frequency: "3 Days / Week",
    description: "Balanced whole-body functional fitness combining moderate strength, core integrity, and cardiovascular health.",
    routines: [
      {
        dayNumber: 1,
        dayTitle: "Day 1: Upper Body & Core Strength",
        focus: "Chest, Back, Arms & Midsection",
        estimatedDurationMin: 25,
        estimatedCalories: 200,
        exercises: [
          {
            name: "Standard Push-ups / Knee Push-ups",
            category: "chest",
            sets: 3,
            reps: "10 reps",
            restSec: 45,
            instructions: "Full extension at top, lower chest to fist-distance above ground.",
          },
          {
            name: "Isometric Plank Hold",
            category: "core",
            sets: 3,
            duration: "30 sec",
            durationSec: 30,
            restSec: 45,
            instructions: "Keep spine neutral, brace core as if anticipating impact.",
          },
          {
            name: "Bodyweight Reverse Rows or Wall Angels",
            category: "back",
            sets: 3,
            reps: "12 reps",
            restSec: 45,
            instructions: "Squeeze shoulder blades together, retract chin.",
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: "Day 2: Aerobic Cardio & Intervals",
        focus: "Cardiovascular Stamina & Rhythm",
        estimatedDurationMin: 28,
        estimatedCalories: 230,
        exercises: [
          {
            name: "Brisk Jogging in Place or High Stepping",
            category: "cardio",
            sets: 3,
            duration: "2 min",
            durationSec: 120,
            restSec: 45,
            instructions: "Maintain light cadence with soft knee landings.",
          },
          {
            name: "Bodyweight Air Squats",
            category: "legs",
            sets: 3,
            reps: "15 reps",
            restSec: 45,
            instructions: "Keep chest tall, push hips back, reach depth safely.",
          },
          {
            name: "Jumping Jacks",
            category: "cardio",
            sets: 3,
            duration: "45 sec",
            durationSec: 45,
            restSec: 30,
            instructions: "Full arm extension overhead with regular breathing rhythm.",
          },
        ],
      },
    ],
  },
};

/**
 * Retrieves the tailored workout regimen based on user's goal.
 */
export function getWorkoutRegimen(goal?: string | null): WorkoutRegimen {
  if (goal && REGIMENS_DATA[goal]) {
    return REGIMENS_DATA[goal];
  }
  return REGIMENS_DATA.maintenance;
}
