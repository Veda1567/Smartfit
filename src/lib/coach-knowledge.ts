/**
 * SmartFit Offline AI Coach Knowledge Base
 * Comprehensive local rule-based knowledge engine covering:
 * - Fitness & Exercise Science (progressive overload, warm-up, cool-down, stretching, cardio vs strength, frequency, form)
 * - Body & Fitness Metrics (BMI vs body fat, BMR, TDEE, metabolism, healthy weight)
 * - Nutrition (macronutrients: protein, carbs, fats; pre/post-workout; balanced diet; foods to limit)
 * - Hydration (daily intake rules, dehydration, workout hydration)
 * - Recovery & Lifestyle (sleep, stress, overtraining, rest days)
 * - Mental Wellness (meditation, breathwork: box breathing, 4-7-8, mindfulness)
 * - Yoga & Mudras (Gyan, Prana, Vayu, Surya, Varun, Apana, Linga mudras)
 * - Cognitive Fitness (brain games, neuroplasticity, chess strategy & CCT)
 * - SmartFit Features (XP formulas, levels, streaks, AI Camera Coach, challenges, leaderboard)
 * - Out-of-domain graceful redirection
 */

export interface KnowledgeAnswer {
  category: string;
  topic: string;
  answer: string;
}

/**
 * Checks whether the user's message is an explicit request for their profile/journey summary.
 */
export function isExplicitProfileSummaryRequest(query: string): boolean {
  const q = query.toLowerCase().trim();

  // Negative guards: questions about "levels", "score", "overload", or metrics are NOT profile summaries
  if (
    q.includes("fat level") ||
    q.includes("sugar level") ||
    q.includes("cortisol level") ||
    q.includes("progressive") ||
    q.includes("overload") ||
    q.includes("what is") ||
    q.includes("why is") ||
    q.includes("how does") ||
    q.includes("does bmi") ||
    q.includes("is bmi") ||
    q.includes("can bmi")
  ) {
    return false;
  }

  // Explicit requests for profile / journey / progress review
  const explicitPatterns = [
    /\b(review|show|view|give me)\b.*\b(my\s+)?(weekly\s+)?(smartfit\s+)?(progress|journey|profile|summary|stats|milestones)\b/i,
    /\bmy\s+(profile|journey|progress|stats)\s*(summary)?\b/i,
    /\b(how much xp do i have|what is my level|what level am i|what is my streak|how is my streak)\b/i,
    /\bprofile\s+(and\s+)?journey\s+summary\b/i,
  ];

  return explicitPatterns.some((pattern) => pattern.test(q));
}

/**
 * Attempts to match general fitness & wellness knowledge questions.
 * Returns structured answer if matched, or null if no direct match.
 */
export function matchGeneralKnowledge(query: string): KnowledgeAnswer | null {
  const q = query.toLowerCase().trim();

  // =========================================================================
  // 1. BODY & FITNESS METRICS: BMI & BODY FAT (Priority Bug & QA Target)
  // =========================================================================

  // BMI vs Body Fat / "Does BMI is correct measure to know fat levels in human body?"
  if (
    (/\bbmi\b/i.test(q) && /\b(fat|accurate|accuracy|measure|metric|indicator|correct|true|level|percentage|differentiate|distinguish|vs)\b/i.test(q)) ||
    /(does|is|can|will)\s+bmi.*(measure|know|tell|show|check|indicate|reflect).*(fat|weight|level)/i.test(q) ||
    /(fat\s+levels?|body\s*fat).*bmi/i.test(q) ||
    /\bbmi\s+vs\s+body\s*fat\b/i.test(q) ||
    /\bdoes bmi is correct measure\b/i.test(q) ||
    /\bis bmi (a )?correct measure\b/i.test(q) ||
    /\bis bmi accurate\b/i.test(q) ||
    /\bcan bmi measure\b/i.test(q) ||
    /\bdoes bmi actually show\b/i.test(q) ||
    /\bbmi and body fat percentage\b/i.test(q)
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "BMI vs Body Fat",
      answer:
        `📊 **Is BMI an Accurate Measure of Body Fat?**\n\n` +
        `**In short: No, BMI does not directly measure body fat.**\n\n` +
        `Here is how BMI works and why it has key limitations:\n\n` +
        `• **What BMI Measures**: Body Mass Index (BMI) is simply a mathematical ratio of total body weight to height squared ($kg/m^2$). It was created as a quick, low-cost population screening tool.\n` +
        `• **Cannot Distinguish Tissue Types**: BMI treats all body weight equally. It cannot tell the difference between skeletal muscle mass, adipose tissue (fat), bone density, or water retention.\n` +
        `• **The Athlete / Muscle Paradox**: Muscular individuals, bodybuilders, or regular weightlifters often register as "overweight" or "obese" on BMI charts despite having very low body fat and excellent metabolic health.\n` +
        `• **The 'Skinny Fat' (Normal Weight Obesity) Limitation**: Conversely, older adults or sedentary individuals may show a "normal" BMI while carrying elevated visceral body fat and minimal muscle mass.\n` +
        `• **Direct Measurement Alternatives**: If you want an accurate assessment of actual body-fat percentage, consider **DEXA (dual-energy X-ray absorptiometry) scans**, hydrostatic underwater weighing, skinfold calipers, or bioelectrical impedance (BIA) scales.\n\n` +
        `**Takeaway**: BMI is a useful high-level screening indicator, but it should never be treated as an exact measurement of your body fat percentage. Focus on waist circumference, strength levels, energy, and overall body composition instead of scale weight alone.`,
    };
  }

  // General BMI definition / formula
  if (
    /\bwhat is bmi\b/i.test(q) ||
    /\bexplain bmi\b/i.test(q) ||
    /\bhow is bmi calculated\b/i.test(q) ||
    /\bbmi formula\b/i.test(q) ||
    /\bbmi categories\b/i.test(q) ||
    /\bbmi meaning\b/i.test(q)
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "BMI Concept & Formula",
      answer:
        `⚖️ **Understanding Body Mass Index (BMI)**:\n\n` +
        `• **Formula**: $\\text{BMI} = \\text{Weight (kg)} / [\\text{Height (m)}]^2$.\n` +
        `• **Standard WHO Categories**:\n` +
        `  - **Underweight**: Below 18.5\n` +
        `  - **Normal / Healthy Weight**: 18.5 – 24.9\n` +
        `  - **Overweight**: 25.0 – 29.9\n` +
        `  - **Obesity**: 30.0 and above\n` +
        `• **Purpose**: BMI serves as an accessible preliminary screening metric for general health risk categories. It does not measure body fat directly or reflect muscle-to-fat ratios.`,
    };
  }

  // BMR (Basal Metabolic Rate)
  if (
    /\bbmr\b/i.test(q) &&
    (/\b(what|explain|how|define|rate|vs|meaning|metabolic)\b/i.test(q) || q.length < 20)
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "Basal Metabolic Rate (BMR)",
      answer:
        `🔥 **What is BMR (Basal Metabolic Rate)?**\n\n` +
        `• **Definition**: BMR is the minimum number of calories your body burns at complete rest in 24 hours just to stay alive (powering breathing, circulation, brain activity, and cellular repair).\n` +
        `• **Contribution**: BMR accounts for approximately **60% to 75%** of your total daily calorie expenditure.\n` +
        `• **Key Factors**: Muscle mass, age, height, biological sex, and genetics dictate your BMR. Having more lean muscle increases your BMR because muscle tissue burns more calories at rest than fat tissue.\n` +
        `• **Practical Rule**: You should rarely eat below your BMR for extended periods, as doing so can down-regulate your thyroid, slow your metabolism, and trigger muscle loss.`,
    };
  }

  // TDEE (Total Daily Energy Expenditure)
  if (
    /\btdee\b/i.test(q) &&
    (/\b(what|explain|how|define|meaning|energy|expenditure|vs)\b/i.test(q) || q.length < 20)
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "Total Daily Energy Expenditure (TDEE)",
      answer:
        `⚡ **What is TDEE (Total Daily Energy Expenditure)?**\n\n` +
        `• **Definition**: TDEE is the total number of calories you burn throughout a full 24-hour day, taking into account all forms of movement and digestion.\n` +
        `• **The 4 Components of TDEE**:\n` +
        `  1. **BMR (~60–75%)**: Basal Metabolic Rate (survival calories at rest).\n` +
        `  2. **NEAT (~15%)**: Non-Exercise Activity Thermogenesis (walking, fidgeting, taking stairs, cleaning).\n` +
        `  3. **EAT (~5–10%)**: Exercise Activity Thermogenesis (intentional workouts, cardio, weightlifting).\n` +
        `  4. **TEF (~10%)**: Thermic Effect of Food (calories burned digesting and absorbing meals — protein has the highest TEF).\n` +
        `• **Energy Balance Application**:\n` +
        `  - Eat at TDEE: **Maintain weight**\n` +
        `  - Eat 300–500 kcal below TDEE: **Sustainable fat loss**\n` +
        `  - Eat 200–400 kcal above TDEE: **Lean muscle building**`,
    };
  }

  // Metabolism & Muscle Mass
  if (
    /\b(how to boost metabolism|metabolic rate|burn calories at rest|does muscle burn more calories)\b/i.test(q) ||
    (/\bmetabolism\b/i.test(q) && /\b(boost|speed|slow|fast|burn|muscle)\b/i.test(q))
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "Metabolism & Muscle Mass",
      answer:
        `💪 **Metabolism & Muscle Mass Explained**:\n\n` +
        `• **Muscle is Metabolically Active**: A pound of muscle burns approximately 3x more calories at rest than a pound of body fat. Building lean muscle naturally elevates your resting metabolic rate.\n` +
        `• **Why Crash Diets Fail**: Severe calorie deficits trigger adaptive thermogenesis (metabolic slowdown), where the body breaks down muscle for fuel and conserves fat.\n` +
        `• **How to Optimize Metabolism**:\n` +
        `  1. Prioritize progressive resistance training 3–4 days/week.\n` +
        `  2. Consume adequate protein (1.2–1.8g per kg body weight) to maximize TEF.\n` +
        `  3. Increase daily steps and incidental movement (NEAT).\n` +
        `  4. Sleep 7–9 hours nightly to keep leptin, ghrelin, and thyroid hormones balanced.`,
    };
  }

  // Body Recomposition & Healthy Weight Concepts
  if (
    /\b(body recomposition|recomp|lose fat and build muscle|lose fat while gain(ing)? muscle|healthy weight concept)\b/i.test(q)
  ) {
    return {
      category: "Body & Fitness Metrics",
      topic: "Body Recomposition",
      answer:
        `🎯 **Body Recomposition (Losing Fat While Building Muscle)**:\n\n` +
        `• **What It Is**: Body recomposition is the process of shedding body fat and gaining lean muscle mass simultaneously, often resulting in a tighter, stronger physique even if the scale weight stays relatively flat.\n` +
        `• **Who It Works Best For**: Beginners, people returning after a hiatus, or individuals with higher body fat percentages.\n` +
        `• **The Strategy**:\n` +
        `  - **Calorie Range**: Eat at maintenance calories or a very slight deficit (100–200 kcal).\n` +
        `  - **High Protein**: Target 1.6–2.0g of protein per kg of body weight daily.\n` +
        `  - **Progressive Overload**: Consistently challenge your muscles in 8–12 rep resistance ranges.\n` +
        `  - **Patience**: Track progress with tape measurements and gym strength rather than bathroom scales.`,
    };
  }

  // =========================================================================
  // 2. FITNESS & EXERCISE SCIENCE FUNDAMENTALS
  // =========================================================================

  // Progressive Overload
  if (/\bprogressive overload\b/i.test(q) || (/\bprogressive\b/i.test(q) && /\b(overload|resistance|stimulus)\b/i.test(q))) {
    return {
      category: "Fitness",
      topic: "Progressive Overload",
      answer:
        `📈 **What is Progressive Overload?**\n\n` +
        `• **The Core Principle**: Progressive overload is the gradual increase of stress placed upon the musculoskeletal and nervous system during resistance training. It is the fundamental law of building muscle and strength.\n` +
        `• **Why It Matters**: If you lift the exact same weight for the exact same reps every month, your body has no physiological reason to adapt, grow, or strengthen.\n` +
        `• **5 Ways to Apply Progressive Overload**:\n` +
        `  1. **Add Resistance**: Increase weight (e.g. from 10 kg to 12.5 kg).\n` +
        `  2. **Add Repetitions**: Perform 12 reps instead of 10 with the same weight.\n` +
        `  3. **Add Volume**: Add an extra working set (e.g. 4 sets instead of 3).\n` +
        `  4. **Improve Tempo & Form**: Slow down the lowering (eccentric) phase for greater time-under-tension.\n` +
        `  5. **Reduce Rest Intervals**: Complete the same volume with 45s rest instead of 60s.\n` +
        `• **SmartFit Tip**: Log your reps and form scores consistently in the Fitness module to ensure gradual progress over time.`,
    };
  }

  // Warm-Up
  if (
    /\bwarm(\s*|-)?up\b/i.test(q) &&
    /\b(why|how|should|importance|benefit|need|start)\b/i.test(q)
  ) {
    return {
      category: "Fitness",
      topic: "Warm-Up Importance",
      answer:
        `🔥 **Why Warming Up Before Exercise is Essential**:\n\n` +
        `• **Elevates Core & Muscle Temperature**: Warmer muscle fibers contract more forcefully and relax faster, boosting power and reaction speed.\n` +
        `• **Joint Lubrication**: Circulates synovial fluid through joints (knees, hips, shoulders) to reduce friction and cartilage wear.\n` +
        `• **Neurological Priming**: Activates motor unit recruitment and prepares the central nervous system for movement patterns.\n` +
        `• **Reduces Acute Injury Risk**: Cold, stiff tendons are significantly more vulnerable to sprains, tears, and strain.\n` +
        `• **The Optimal Warm-Up Protocol (5–8 min)**:\n` +
        `  1. 2–3 minutes light cardio (jog in place, jumping jacks) to raise heart rate.\n` +
        `  2. Dynamic stretches (arm circles, leg swings, torso rotations, hip openers).\n` +
        `  3. 1–2 lightweight or bodyweight rehearsal sets of your main exercise.`,
    };
  }

  // Cool-Down
  if (
    /\bcool(\s*|-)?down\b/i.test(q) &&
    /\b(why|how|should|importance|benefit|need|after)\b/i.test(q)
  ) {
    return {
      category: "Fitness",
      topic: "Cool-Down Benefits",
      answer:
        `🧊 **The Purpose of a Workout Cool-Down**:\n\n` +
        `• **Gradual Heart Rate Deceleration**: Prevents blood from pooling in extremities, which can cause post-workout dizziness or fainting.\n` +
        `• **Parasympathetic Activation**: Shifts your autonomic nervous system from "fight-or-flight" training mode into "rest-and-digest" recovery mode.\n` +
        `• **Lactate & Metabolic Clearance**: Gentle movement promotes venous return, flushing metabolic byproducts from muscle beds.\n` +
        `• **Protocol (3–5 min)**: Light walking followed by static stretching holding tight muscles (hamstrings, chest, hip flexors) for 20–30 seconds.`,
    };
  }

  // Stretching & Flexibility
  if (
    (/\bstretch(ing)?\b/i.test(q) || /\bflexibility\b/i.test(q)) &&
    (/\b(benefit|why|importance|improve|dynamic|static|vs|good|need|range of motion)\b/i.test(q) || q.includes("benefit of stretching"))
  ) {
    return {
      category: "Fitness",
      topic: "Stretching & Flexibility",
      answer:
        `🧘 **The Science of Stretching & Flexibility**:\n\n` +
        `• **Restores Resting Muscle Length**: Intense resistance training shortens muscle fibers; post-workout stretching restores structural balance.\n` +
        `• **Improves Joint Range of Motion & Flexibility**: Greater mobility and flexibility (range of motion) enable full-depth squats, safe overhead presses, and optimal running mechanics.\n` +
        `• **Dynamic vs. Static Stretching**:\n` +
        `  - **Dynamic (Before Workout)**: Continuous motion stretches (leg swings, arm hugs) to prepare active joints.\n` +
        `  - **Static (After Workout / Rest Days)**: Sustained 20–40s holds when muscles are warm to safely extend connective tissue.\n` +
        `• **SmartFit Tip**: Explore our dedicated **Flexibility & Mudras** modules for daily guided mobility flows.`,
    };
  }

  // Cardio vs Strength Training
  if (
    /\b(cardio vs (strength|weights|lifting)|(strength|weights|lifting) vs cardio|should i do cardio or (weights|strength)|difference between cardio and (strength|weights))\b/i.test(q) ||
    (/\bcardio\b/i.test(q) && /\b(strength|weights|lifting)\b/i.test(q) && /\b(vs|better|difference|or|combine)\b/i.test(q))
  ) {
    return {
      category: "Fitness",
      topic: "Cardio vs Strength Training",
      answer:
        `⚖️ **Cardio vs. Strength Training: Which is Better?**\n\n` +
        `The short answer: **They serve different physiological purposes and work best together!**\n\n` +
        `• **Cardiovascular Training (Running, Cycling, HIIT, Swimming)**:\n` +
        `  - Strengthens heart muscle, lowers resting blood pressure, and increases VO2 max.\n` +
        `  - Burns more immediate calories *during* the session.\n` +
        `  - Enhances capillary density and mitochondrial efficiency.\n` +
        `• **Resistance / Strength Training (Weights, Calisthenics)**:\n` +
        `  - Stimulates muscle hypertrophy and maintains bone mineral density.\n` +
        `  - Elevates resting metabolic rate (burns more calories 24/7).\n` +
        `  - Improves insulin sensitivity and protects joints against osteoarthritis.\n` +
        `• **The Ideal Hybrid Split**: 2–3 strength sessions + 1–2 aerobic cardio sessions per week for complete metabolic and longevity fitness.`,
    };
  }

  // Exercise Frequency & Rest Days
  if (
    /\brest days?\b/i.test(q) ||
    (/\b(how often|how many days|frequency)\b/i.test(q) && /\b(exercise|workout|train)\b/i.test(q)) ||
    /\bcan i work(out)? every day\b/i.test(q)
  ) {
    return {
      category: "Fitness",
      topic: "Exercise Frequency & Rest Days",
      answer:
        `📅 **How Often Should You Exercise & Why Rest Days Matter**:\n\n` +
        `• **Recommended Frequency**: 3 to 5 structured workout sessions per week is optimal for most adults.\n` +
        `• **Muscles Grow During Rest, Not During Training**: Workouts break down muscle micro-fibers; rest, nutrition, and sleep rebuild and repair them thicker and stronger.\n` +
        `• **Dangers of Skipping Rest Days**: Chronic fatigue, elevated injury risk, hormonal imbalances (high cortisol, low testosterone), and training plateaus.\n` +
        `• **Active Recovery on Rest Days**: You don't have to be completely sedentary! Enjoy light walking, gentle yoga, or a mindfulness session on /wellness to keep blood moving.`,
    };
  }

  // Beginner Fitness & Getting Started
  if (
    /\b(i am a beginner|beginner fitness|where to start (exercising|working out)|fitness for beginners|how to start working out)\b/i.test(q)
  ) {
    return {
      category: "Fitness",
      topic: "Beginner Fitness Guidance",
      answer:
        `🌱 **Beginner Fitness Roadmap**:\n\n` +
        `• **1. Consistency Over Intensity**: 20 minutes done 3 times a week consistently beats a grueling 2-hour workout that leaves you too sore to move for a week.\n` +
        `• **2. Master the Fundamentals**: Focus on compound bodyweight movements (Air Squats, Incline Push-Ups, Glute Bridges, Plank Holds).\n` +
        `• **3. Prioritize Technique**: Use our **AI Camera Form Coach** to verify your squat and push-up form before adding heavy resistance.\n` +
        `• **4. Build the Habit**: Schedule workout days on your calendar just like an important appointment.\n` +
        `• **5. Hydrate & Recover**: Drink water throughout the day and get 7–8 hours of restorative sleep.`,
    };
  }

  // Posture & Exercise Form
  if (
    /\b(why is exercise form important|proper (exercise )?form|importance of form|improve posture|good posture)\b/i.test(q)
  ) {
    return {
      category: "Fitness",
      topic: "Posture & Exercise Form",
      answer:
        `📐 **The Critical Importance of Exercise Form & Posture**:\n\n` +
        `• **Injury Prevention**: Flawless biomechanics places the load directly on prime mover muscles rather than connective tendons and spinal discs.\n` +
        `• **Maximum Muscle Recruitment**: Performing an exercise through its full intended range of motion stimulates more motor units for faster growth.\n` +
        `• **Postural Alignment**: Sitting all day shortens hip flexors and rounds shoulders. Exercises with an engaged core, retracted scapulae, and neutral spine restore upright posture.\n` +
        `• **SmartFit AI Vision Coach**: Our camera coach uses on-device pose estimation to check knee depth, elbow angle, and spine alignment in real time!`,
    };
  }

  // =========================================================================
  // 3. NUTRITION & MACRONUTRIENTS
  // =========================================================================

  // Protein vs Carbohydrates vs Fats (Macronutrients)
  if (
    (/\bprotein\b/i.test(q) && /\b(carb|carbs|carbohydrate|carbohydrates)\b/i.test(q)) ||
    /\b(what are macronutrients|explain macros|protein carbs? and fats?|macronutrient ratio)\b/i.test(q)
  ) {
    return {
      category: "Nutrition",
      topic: "Macronutrients Overview",
      answer:
        `🥗 **Protein vs. Carbohydrates vs. Fats: The 3 Macronutrients**:\n\n` +
        `Every calorie you consume comes from one of three primary macronutrients:\n\n` +
        `• **1. Protein (4 kcal per gram)**:\n` +
        `  - **Primary Role**: The structural building blocks for repairing muscle fibers, enzymes, antibodies, and skin.\n` +
        `  - **Key Benefit**: Highest satiety (keeps you full longest) and highest thermic effect of food (burns calories digesting).\n` +
        `  - **Sources**: Eggs, tofu, lentils, chicken, fish, Greek yogurt, legumes.\n\n` +
        `• **2. Carbohydrates (4 kcal per gram)**:\n` +
        `  - **Primary Role**: The body's preferred and most efficient energy source for brain function and high-intensity muscular work.\n` +
        `  - **Key Distinction**: Prioritize slow-digesting **complex carbs** (oats, brown rice, sweet potatoes) over refined simple sugars.\n\n` +
        `• **3. Healthy Fats (9 kcal per gram)**:\n` +
        `  - **Primary Role**: Critical for hormone synthesis (testosterone, estrogen), brain cell membrane integrity, and absorbing fat-soluble vitamins (A, D, E, K).\n` +
        `  - **Sources**: Avocados, extra virgin olive oil, nuts, seeds, fatty fish (salmon).`,
    };
  }

  // Protein Deep-Dive
  if (
    /\b(how much protein|why is protein important|protein benefits|best protein sources|protein for muscle)\b/i.test(q)
  ) {
    return {
      category: "Nutrition",
      topic: "Protein Intake & Benefits",
      answer:
        `🥩 **Protein Intake Guidelines**:\n\n` +
        `• **Recommended Daily Targets**:\n` +
        `  - **Sedentary / General Health**: 0.8g to 1.0g per kg of body weight.\n` +
        `  - **Active / Resistance Training**: 1.4g to 2.0g per kg of body weight to support muscle recovery and growth.\n` +
        `  - **Fat Loss / Calorie Deficit**: 1.6g to 2.2g per kg of body weight to prevent muscle wasting while dieting.\n` +
        `• **Distribution**: Aim for 20–35g of quality protein per meal spread evenly across the day to optimize muscle protein synthesis.`,
    };
  }

  // Pre-Workout & Post-Workout Nutrition
  if (
    (/\b(pre(\s*|-)workout|post(\s*|-)workout)\b/i.test(q) && /\b(food|meal|snack|nutrition|eat)\b/i.test(q)) ||
    (/\beat\b/i.test(q) && (/\bbefore\b/i.test(q) || /\bafter\b/i.test(q)) && /\b(workout|exercise|training)\b/i.test(q))
  ) {
    return {
      category: "Nutrition",
      topic: "Pre & Post-Workout Nutrition",
      answer:
        `🍌 **Pre-Workout & Post-Workout Fueling Guide**:\n\n` +
        `• **Pre-Workout Fuel (45–60 min before)**:\n` +
        `  - **Goal**: Readily available glycogen for working muscles without stomach distress.\n` +
        `  - **Best Choices**: Banana with 1 tbsp peanut butter, oatmeal with berries, or rice cakes with a splash of honey.\n` +
        `  - **Avoid**: Heavy fats or excessive fiber immediately before training, which delay gastric emptying.\n\n` +
        `• **Post-Workout Recovery (within 60–90 min)**:\n` +
        `  - **Goal**: Kickstart muscle protein synthesis and replenish depleted muscle glycogen stores.\n` +
        `  - **Best Choices**: Grilled chicken with quinoa, tofu-veggie stir fry with brown rice, or Greek yogurt with berries.\n` +
        `  - **Hydration**: Drink 500ml of water with electrolytes to restore fluid balance.`,
    };
  }

  // Balanced Diet & Foods to Limit
  if (
    /\b(what is a balanced diet|healthy foods to eat|foods to limit|healthy eating principles)\b/i.test(q)
  ) {
    return {
      category: "Nutrition",
      topic: "Balanced Diet Fundamentals",
      answer:
        `🥑 **Principles of a Balanced, Sustainable Diet**:\n\n` +
        `• **The 80/20 Rule**: Consume whole, minimally processed, nutrient-dense foods 80% of the time, allowing 20% flexibility for social occasions.\n` +
        `• **Plate Blueprint**:\n` +
        `  - 1/2 Plate: Non-starchy colorful vegetables (spinach, broccoli, peppers, greens).\n` +
        `  - 1/4 Plate: Lean protein (tofu, legumes, eggs, poultry, fish).\n` +
        `  - 1/4 Plate: Complex carbohydrates (brown rice, oats, sweet potatoes, whole grains).\n` +
        `  - 1–2 Thumb-sizes: Healthy fats (olive oil, seeds, avocado).\n` +
        `• **Foods to Limit**: Highly refined sugars, trans fats, sugar-sweetened beverages, and ultra-processed shelf-stable snacks.`,
    };
  }

  // =========================================================================
  // 4. HYDRATION
  // =========================================================================

  if (
    /\b(how much water should i drink|daily water intake|benefits of (drinking )?water|why (is )?water important|hydration benefits)\b/i.test(q)
  ) {
    return {
      category: "Hydration",
      topic: "Daily Water Intake",
      answer:
        `💧 **How Much Water Should You Drink Daily?**\n\n` +
        `• **Standard Formula**: A reliable rule of thumb is **30 to 35 ml of water per kilogram of body weight** per day.\n` +
        `  - 60 kg person: ~1.8 to 2.1 Liters (~8 glasses)\n` +
        `  - 75 kg person: ~2.3 to 2.6 Liters (~10 glasses)\n` +
        `  - 90 kg person: ~2.7 to 3.2 Liters (~12 glasses)\n` +
        `• **Exercise & Climate Adjustment**: Add 400–600 ml for every 45 minutes of vigorous exercise or hot weather.\n` +
        `• **Proven Benefits**: Regulates body temperature, lubricates joints, aids nutrient absorption, prevents kidney stones, and sharpens cognitive focus.\n` +
        `• **Hydration Check**: Pale straw-colored urine indicates healthy hydration; dark amber urine signals you need to drink.`,
    };
  }

  if (
    /\b(dehydrat(ed|ion)|electrolyte)\b/i.test(q) ||
    /\bhydration (around|during|after) exercise\b/i.test(q)
  ) {
    return {
      category: "Hydration",
      topic: "Dehydration & Workout Hydration",
      answer:
        `🥤 **Dehydration Basics & Exercise Hydration**:\n\n` +
        `• **The 2% Drop**: Losing just 2% of your body weight in fluid can reduce muscular endurance by up to 15% and impair cognitive focus.\n` +
        `• **Warning Signs**: Dry mouth, dark urine, headaches, muscle cramping, lethargy, and unexplained elevated heart rate during exercise.\n` +
        `• **Workout Protocol**:\n` +
        `  - Drink 400ml 2 hours before exercising.\n` +
        `  - Sip 150–250ml every 15–20 minutes during vigorous exercise.\n` +
        `  - Rehydrate with water and a light pinch of salt or electrolyte food post-workout.`,
    };
  }

  // =========================================================================
  // 5. RECOVERY & SLEEP
  // =========================================================================

  if (
    /\bsleep\b/i.test(q) &&
    (/\b(why|how much|importance|benefit|muscle|fitness|recovery|fat loss|growth hormone|hgh|vital|essential)\b/i.test(q) || q.includes("why is sleep important"))
  ) {
    return {
      category: "Recovery & Lifestyle",
      topic: "Sleep for Fitness & Recovery",
      answer:
        `😴 **Why Sleep is Crucial for Fitness & Health**:\n\n` +
        `• **Human Growth Hormone (HGH) Peak**: Over 70% of daily growth hormone is secreted during Stage 3 deep non-REM sleep, driving muscle repair and fat mobilization.\n` +
        `• **Glycogen & Cellular Restoration**: Sleep replenishes energy substrates inside skeletal muscle and restores nervous system readiness.\n` +
        `• **Hunger Hormone Balance**: Sleep deprivation spikes **ghrelin** (appetite stimulator) and suppresses **leptin** (satiety signal), driving intense junk food cravings.\n` +
        `• **Target**: Active adults require **7 to 9 hours** of uninterrupted sleep nightly.\n` +
        `• **Sleep Hygiene Tips**: Cut caffeine 8 hours before bed, dim screens 60 minutes before sleep, and keep your bedroom cool (~18–20°C).`,
    };
  }

  if (
    /\bstress\b/i.test(q) &&
    /\b(affect|impact|cortisol|body|weight|fitness|recovery|manage)\b/i.test(q)
  ) {
    return {
      category: "Recovery & Lifestyle",
      topic: "Stress, Cortisol & Recovery",
      answer:
        `🧠 **How Stress Impacts Your Fitness & Body**:\n\n` +
        `• **Cortisol Overload**: Chronic mental stress keeps cortisol elevated, which increases muscle catabolism (breakdown) and promotes visceral abdominal fat storage.\n` +
        `• **Impaired Glycogen Storage**: Stressed muscles are less sensitive to insulin, impairing recovery after training.\n` +
        `• **Mitigation**: Incorporate daily stress-reduction practices. Even 4 minutes of Box Breathing or a short mudra practice on SmartFit activates the vagus nerve and dampens cortisol output.`,
    };
  }

  // =========================================================================
  // 6. MENTAL WELLNESS & BREATHWORK
  // =========================================================================

  if (
    (/\bmeditat(e|ion|ing)\b/i.test(q) || /\bmindful(ness)?\b/i.test(q)) &&
    (/\b(what|how|why|benefit|start|practice|technique)\b/i.test(q) || q.length < 25)
  ) {
    return {
      category: "Mental Wellness",
      topic: "Meditation & Mindfulness",
      answer:
        `🧘 **What is Meditation & How to Practice It**:\n\n` +
        `• **Definition**: Meditation is a scientifically backed mental training technique to cultivate intentional focus, emotional resilience, and autonomic calm.\n` +
        `• **Core Practice (Breath Awareness)**:\n` +
        `  1. Sit comfortably with an upright, relaxed spine.\n` +
        `  2. Anchor your attention onto the natural sensation of breath entering and leaving your nostrils.\n` +
        `  3. When your mind inevitably wanders, simply notice the thought without self-judgment and gently return attention to your breath.\n` +
        `• **Proven Benefits**: Reduces amygdala reactivity (fear/stress center), lowers blood pressure, enhances working memory, and improves sleep quality.\n` +
        `• **Start Small**: 3 to 5 minutes daily on our **/meditation** page builds lifelong neurological consistency.`,
    };
  }

  if (
    /\bbox breathing\b/i.test(q) ||
    /\b4-7-8\b/i.test(q) ||
    /\bdiaphragmatic\b/i.test(q) ||
    (/\bbreathing (exercise|technique|practice)\b/i.test(q))
  ) {
    return {
      category: "Mental Wellness",
      topic: "Breathwork Techniques",
      answer:
        `🌬️ **Proven Breathwork Techniques for Calm & Focus**:\n\n` +
        `• **1. Box Breathing (4-4-4-4 Technique)**:\n` +
        `  - **How**: Inhale for 4s $\\rightarrow$ Hold breath for 4s $\\rightarrow$ Exhale smoothly for 4s $\\rightarrow$ Hold empty for 4s.\n` +
        `  - **Purpose**: Balances autonomic tone, restores heart rate variability, and calms acute adrenaline spikes.\n\n` +
        `• **2. 4-7-8 Deep Sleep Breathing**:\n` +
        `  - **How**: Inhale quietly through nose for 4s $\\rightarrow$ Hold for 7s $\\rightarrow$ Whoosh exhale through mouth for 8s.\n` +
        `  - **Purpose**: Acts as a natural tranquilizer for the nervous system, ideal right before bedtime.\n\n` +
        `• **3. Diaphragmatic Belly Breathing**:\n` +
        `  - **How**: Place hand on belly. Expand abdomen on inhale, sink on exhale. Eliminates shallow, anxiety-inducing chest breathing.`,
    };
  }

  // =========================================================================
  // 7. YOGA & MUDRAS
  // =========================================================================

  if (
    /\bmudra(s)?\b/i.test(q) &&
    (/\b(what|how|why|purpose|benefit|work|hand|meaning|list)\b/i.test(q) || q.length < 25)
  ) {
    return {
      category: "Yoga / Mudras",
      topic: "Mudras Overview & Purpose",
      answer:
        `🖐️ **What are Yogic Mudras & How Do They Work?**\n\n` +
        `• **Concept**: In yogic tradition, *Mudras* are intentional hand postures and finger contacts that engage the dense concentration of nerve endings in our fingertips.\n` +
        `• **Mechanism**: Fingers correspond to elemental reflex points. Bringing specific fingertips together channels awareness, focuses the brain during meditation, and stimulates reflexology pathways.\n` +
        `• **Supported Mudras in SmartFit**:\n` +
        `  - **Gyan Mudra**: Thumb + index finger for mental focus, memory, and meditation.\n` +
        `  - **Prana Mudra**: Thumb + ring + little finger for vital life-force and fatigue relief.\n` +
        `  - **Vayu Mudra**: Index finger folded to base of thumb for releasing nervous tension and restlessness.\n` +
        `  - **Surya Mudra**: Ring finger folded to base of thumb for metabolic warmth and digestion.\n` +
        `  - **Varun Mudra**: Thumb + little finger for fluid balance and hydration awareness.\n` +
        `• **How to Practice**: Hold lightly with relaxed shoulders for 10–15 minutes during meditation on the **/mudras** page.`,
    };
  }

  // =========================================================================
  // 8. COGNITIVE WELLNESS & CHESS
  // =========================================================================

  if (
    (/\bbrain games?\b/i.test(q) || /\bcognitive (training|fitness|games?)\b/i.test(q) || /\bneuroplasticity\b/i.test(q)) ||
    (/\btrain (my )?memory\b/i.test(q) || /\bimprove (focus|concentration|memory)\b/i.test(q))
  ) {
    return {
      category: "Cognitive Wellness",
      topic: "Cognitive Training & Neuroplasticity",
      answer:
        `🧩 **Cognitive Wellness & Brain Fitness**:\n\n` +
        `• **Neuroplasticity**: Just like muscles adapt to resistance training, brain synapses strengthen and reorganize when challenged by novel cognitive puzzles and tactical problem solving.\n` +
        `• **Core Pillars**: Working memory, processing speed, spatial calculation, and sustained executive attention.\n` +
        `• **The Mind-Body Link**: Regular cardiovascular workouts stimulate Brain-Derived Neurotrophic Factor (BDNF), priming the brain for faster learning and memory retention.\n` +
        `• **SmartFit Drills**: Challenge yourself in our **Cognitive & Chess** arena daily to sharpen cognitive clarity and earn bonus XP!`,
    };
  }

  // =========================================================================
  // 9. SMARTFIT FEATURES & HOW SMARTFIT WORKS
  // =========================================================================

  if (
    (/\bsmartfit\b/i.test(q) && /\b(what is|how does|work|features|about)\b/i.test(q)) ||
    /\bhow does smartfit work\b/i.test(q)
  ) {
    return {
      category: "SmartFit Features",
      topic: "SmartFit Overview",
      answer:
        `🚀 **About SmartFit: The Unified Mind-Body Health Platform**:\n\n` +
        `SmartFit integrates physical conditioning, AI vision coaching, mental wellness, and cognitive fitness into one gamified ecosystem:\n\n` +
        `• **1. Physical Fitness & Interval Timer**: Personalized multi-day routines, custom HIIT timers, and calorie tracking.\n` +
        `• **2. AI Camera Form Coach**: On-device WebAssembly vision that analyzes your squat, push-up, and curl form in real time with zero video upload.\n` +
        `• **3. Mental Wellness & Mudras**: Daily mood check-ins, guided box breathing, and traditional mudra practices for autonomic balance.\n` +
        `• **4. Chess & Brain Games**: Tactical chess puzzles and cognitive speed drills to exercise executive function.\n` +
        `• **5. Gamification**: Earn XP, unlock milestone achievements, build consistency streaks, and rise up the global leaderboard!`,
    };
  }

  if (
    (/\bxp\b/i.test(q) && /\b(earn|work|calculate|how|level|formula)\b/i.test(q)) ||
    /\bhow do levels work\b/i.test(q) ||
    /\bhow do streaks work\b/i.test(q) ||
    /\bwhat resets (my )?streak\b/i.test(q)
  ) {
    return {
      category: "SmartFit Features",
      topic: "XP, Levels & Streaks",
      answer:
        `🏆 **SmartFit Gamification: XP, Levels & Streaks**:\n\n` +
        `• **How to Earn XP**:\n` +
        `  - Complete a Workout: **+100 XP**\n` +
        `  - AI Camera Coach Session: **Up to +85 XP** (based on clean reps and form quality)\n` +
        `  - Wellness Mood Check-In: **+25 XP**\n` +
        `  - Guided Breathing / Meditation: **+30 to +50 XP**\n` +
        `  - Chess Tactical Drill / Brain Game: **+40 XP**\n` +
        `  - Daily AI Coach Consultation: **+15 XP**\n` +
        `• **Level Progression Formula**: $\\text{Level} = \\lfloor(\\text{Total XP} / 100)^{1/1.5}\\rfloor + 1$. Level 2 unlocks at 283 XP, Level 3 at 520 XP, and beyond!\n` +
        `• **Streaks**: Logging at least 1 verified activity each day maintains and increments your consistency streak. If 48+ hours pass without activity, your streak resets to 0.`,
    };
  }

  if (
    (/\b(camera|vision)\b/i.test(q) && /\b(coach|form|ai|work|rep|private|privacy)\b/i.test(q)) ||
    /\bmediapipe\b/i.test(q)
  ) {
    return {
      category: "SmartFit Features",
      topic: "AI Camera Form Coach",
      answer:
        `📷 **SmartFit AI Camera Form Coach**:\n\n` +
        `• **What It Does**: Uses MediaPipe vision models to track 33 standard skeletal landmarks in real time through your webcam, accurately counting repetitions and evaluating biomechanical form.\n` +
        `• **Supported Exercises**: **Bodyweight Squats** (knee depth $\\le 100^\\circ$), **Push-ups** (elbow bend $\\le 95^\\circ$ + core alignment), and **Bicep Curls** (full extension to peak contraction $\\le 60^\\circ$).\n` +
        `• **100% On-Device Privacy**: All neural vision inference executes locally in your browser using WebAssembly. **No video or camera images are ever recorded, uploaded, or transmitted to any server.**\n` +
        `• **Server-Validated XP**: To ensure fairness, rep counts are verified against biomechanical speed limits on the server before awarding XP.`,
    };
  }

  return null;
}

/**
 * Checks whether a query is clearly out of domain (e.g. general trivia, coding, politics, finance).
 */
export function isOutOfDomainQuery(query: string): boolean {
  const q = query.toLowerCase().trim();

  // If query matches any health/fitness/wellness keywords, it is IN domain
  const inDomainKeywords = [
    "fitness", "workout", "exercise", "routine", "muscle", "squat", "pushup", "curl", "reps", "sets",
    "gym", "diet", "nutrition", "food", "calorie", "protein", "carb", "fat", "snack", "eat", "meal",
    "water", "hydrat", "drink", "sleep", "stress", "rest", "relax", "breath", "meditat", "mindful",
    "mudra", "yoga", "brain", "cognitive", "memory", "chess", "smartfit", "xp", "streak", "level",
    "challenge", "leaderboard", "coach", "bmi", "bmr", "tdee", "weight", "height", "health", "posture",
    "overload", "warmup", "warm up", "cool down", "stretch", "run", "cardio", "body fat", "fat level",
    "chest pain", "injury", "ache", "pain", "doctor", "prescribe", "heart", "pulse", "recovery"
  ];

  if (inDomainKeywords.some((kw) => q.includes(kw))) {
    return false;
  }

  // Clear out-of-domain patterns
  const outOfDomainPatterns = [
    /\b(who won|president|prime minister|politics|election|vote|war|military)\b/i,
    /\b(capital of|population of|weather in|stock price|cryptocurrency|bitcoin|ethereum|shares|invest in)\b/i,
    /\b(python code|javascript code|write code|debug code|regex for|sql query|git commit)\b/i,
    /\b(movie review|actor in|lyrics of|football score|world cup winner)\b/i,
  ];

  if (outOfDomainPatterns.some((pattern) => pattern.test(q))) {
    return true;
  }

  // If query is 3+ words and contains zero fitness/wellness terminology
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    const hasAnyFitnessContext = inDomainKeywords.some((kw) => q.includes(kw));
    if (!hasAnyFitnessContext) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an out-of-domain response clearly stating the coach's specialty.
 */
export function generateOutOfDomainResponse(): string {
  return (
    `I am your dedicated **SmartFit Fitness & Wellness Coach**! 🏃‍♂️\n\n` +
    `My expertise is focused on:\n` +
    `• Workout routines, exercise form, and progressive overload\n` +
    `• Body metrics (BMI, body fat, BMR, TDEE, healthy weight)\n` +
    `• Balanced nutrition, protein needs, and pre/post-workout fueling\n` +
    `• Daily hydration and recovery\n` +
    `• Breathwork, meditation, and yogic mudras\n` +
    `• Cognitive brain fitness, chess tactics, and SmartFit tracking\n\n` +
    `I am not designed for topics outside health, wellness, and fitness. Ask me a question about your training, diet, recovery, or wellness practices and I'll gladly help!`
  );
}
