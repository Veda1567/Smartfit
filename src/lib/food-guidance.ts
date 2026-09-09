/**
 * SmartFit Food & Nutrition Guidance Engine
 * Provides safe, non-medical dietary suggestions, food categories, and meal ideas
 * mapped to the user's fitness goal and daily caloric targets.
 */

export interface MealSuggestion {
  meal: "Breakfast" | "Lunch" | "Dinner" | "Snacks & Pre/Post Workout";
  title: string;
  description: string;
  caloriePortion: string;
  keyNutrients: string;
}

export interface FoodCategory {
  name: string;
  iconName: "Flame" | "Apple" | "Fish" | "Wheat" | "ShieldCheck";
  description: string;
  examples: string[];
}

export interface GoalFoodGuidance {
  goalKey: string;
  goalTitle: string;
  dailyCalorieGuidance: number;
  macroDistribution: {
    protein: string;
    carbs: string;
    fats: string;
  };
  recommendedCategories: FoodCategory[];
  mealPlanSuggestions: MealSuggestion[];
  foodsToLimit: string[];
  hydrationTips: string;
  wellnessPrinciples: string[];
  medicalDisclaimer: string;
}

const COMMON_DISCLAIMER =
  "Non-Medical Wellness Guidance: These meal ideas and food suggestions are for general nutritional education and wellness planning only. They are not medical nutrition therapy or clinical diets. Individuals with medical conditions, allergies, metabolic disorders, or specific dietary requirements should consult a licensed healthcare provider or registered dietitian before making significant dietary changes.";

/**
 * Generates goal-oriented, practical food and nutrition recommendations.
 */
export function getFoodGuidance(params: {
  fitnessGoal?: string | null;
  targetCalories?: number | null;
  weightKg?: number | null;
  activityLevel?: string | null;
}): GoalFoodGuidance {
  const goal = params.fitnessGoal || "maintenance";
  const calories = params.targetCalories || 2000;

  if (goal === "weight_loss") {
    return {
      goalKey: "weight_loss",
      goalTitle: "Weight & Fat Loss",
      dailyCalorieGuidance: calories,
      macroDistribution: {
        protein: "30% (High Satiety)",
        carbs: "40% (Complex & High Fiber)",
        fats: "30% (Healthy Unsaturated)",
      },
      recommendedCategories: [
        {
          name: "Lean Protein Powerhouses",
          iconName: "Fish",
          description: "Supports muscle preservation while in a safe caloric deficit and increases thermogenesis.",
          examples: ["Skinless chicken breast", "Tofu & tempeh", "Wild salmon or white fish", "Greek yogurt (low-fat)", "Egg whites & whole eggs", "Edamame"],
        },
        {
          name: "High-Volume, Low-Calorie Vegetables",
          iconName: "Apple",
          description: "Provides bulk, essential micronutrients, and fiber to promote fullness.",
          examples: ["Broccoli & cauliflower", "Spinach & kale", "Zucchini & asparagus", "Bell peppers", "Cucumbers & celery"],
        },
        {
          name: "Slow-Digesting Complex Carbohydrates",
          iconName: "Wheat",
          description: "Stabilizes blood sugar and prevents energy crashes during workouts.",
          examples: ["Steel-cut oats", "Quinoa", "Sweet potatoes", "Brown rice", "Lentils & black beans"],
        },
        {
          name: "Heart-Healthy Essential Fats",
          iconName: "ShieldCheck",
          description: "Sustains cellular health and hormone regulation in measured portions.",
          examples: ["Avocado (1/4 to 1/2 serving)", "Extra virgin olive oil", "Raw almonds & walnuts", "Chia & flax seeds"],
        },
      ],
      mealPlanSuggestions: [
        {
          meal: "Breakfast",
          title: "High-Protein Berry Oatmeal Bowl",
          description: "Rolled oats simmered in water or almond milk, topped with a scoop of plant/whey protein powder, half-cup of blueberries, and 1 tsp chia seeds.",
          caloriePortion: `~${Math.round(calories * 0.25)} kcal`,
          keyNutrients: "Protein, soluble fiber, antioxidants",
        },
        {
          meal: "Lunch",
          title: "Rainbow Quinoa & Grilled Chicken Bowl",
          description: "Warm quinoa layered with grilled chicken or crispy tofu, steamed broccoli, diced cucumber, and a light tahini-lemon dressing.",
          caloriePortion: `~${Math.round(calories * 0.35)} kcal`,
          keyNutrients: "Lean protein, zinc, iron, complex carbohydrates",
        },
        {
          meal: "Dinner",
          title: "Baked Salmon with Roasted Asparagus & Sweet Potato",
          description: "Herb-crusted wild salmon fillet accompanied by roasted asparagus spears and half a roasted sweet potato.",
          caloriePortion: `~${Math.round(calories * 0.3)} kcal`,
          keyNutrients: "Omega-3 fatty acids, potassium, vitamin A",
        },
        {
          meal: "Snacks & Pre/Post Workout",
          title: "Greek Yogurt with Crushed Walnuts or Apple Slices",
          description: "150g unsweetened Greek yogurt with 5 crushed walnut halves or crisp apple slices with cinnamon.",
          caloriePortion: `~${Math.round(calories * 0.1)} kcal`,
          keyNutrients: "Probiotics, calcium, slow-burning energy",
        },
      ],
      foodsToLimit: [
        "Sugar-sweetened beverages (sodas, sweetened iced teas, fruit juice cocktails)",
        "Ultra-processed pastries, cookies, and packaged snack foods",
        "Deep-fried fast foods containing high trans and saturated fats",
        "Refined white breads and high-sugar breakfast cereals",
      ],
      hydrationTips:
        "Drink a glass of water 20–30 minutes before each meal to support optimal digestion and mindful portion recognition.",
      wellnessPrinciples: [
        "Prioritize protein at every meal to preserve metabolically active muscle tissue.",
        "Eat fiber-rich vegetables first to curb hunger naturally.",
        "Aim for steady, sustainable progress (~0.5 kg to 1 kg per week). Avoid extreme crash dieting.",
      ],
      medicalDisclaimer: COMMON_DISCLAIMER,
    };
  }

  if (goal === "muscle_gain") {
    return {
      goalKey: "muscle_gain",
      goalTitle: "Hypertrophy & Muscle Tone",
      dailyCalorieGuidance: calories,
      macroDistribution: {
        protein: "25–30% (1.6–2.2g per kg bodyweight)",
        carbs: "50% (Glycogen Replenishment)",
        fats: "20–25% (Anabolic Hormone Support)",
      },
      recommendedCategories: [
        {
          name: "Complete Muscle-Building Proteins",
          iconName: "Fish",
          description: "Supplies essential branched-chain amino acids (leucine, isoleucine, valine) for muscle synthesis.",
          examples: ["Chicken & turkey breast", "Cottage cheese & Greek yogurt", "Lean beef or bison", "Salmon & tuna", "Tofu, tempeh & seitan", "Whey or pea protein isolate"],
        },
        {
          name: "Dense Complex Carbohydrates",
          iconName: "Wheat",
          description: "Restores muscular glycogen reserves so you can train with higher intensity and volume.",
          examples: ["Jasmine & basmati rice", "Whole-grain pasta", "Sweet & russet potatoes", "Old-fashioned oats", "Bananas & dried fruits"],
        },
        {
          name: "Calorie-Dense Nut & Seed Fats",
          iconName: "Flame",
          description: "Helps hit caloric surplus targets without creating excessive abdominal bloating.",
          examples: ["Natural peanut & almond butter", "Raw walnuts, cashews & almonds", "Extra virgin olive oil & avocado oil", "Pumpkin & hemp seeds"],
        },
        {
          name: "Recovery Micronutrients",
          iconName: "Apple",
          description: "Reduces oxidative stress and supports connective tissue repair.",
          examples: ["Tart cherries & dark berries", "Spinach & dark leafy greens", "Pineapple (bromelain enzyme)", "Citrus fruits (vitamin C)"],
        },
      ],
      mealPlanSuggestions: [
        {
          meal: "Breakfast",
          title: "Muscle Power Oatmeal with Nut Butter & Banana",
          description: "Rolled oats cooked with whole milk or soy milk, 1 scoop whey/plant protein, 1 sliced banana, and 2 tbsp natural peanut butter.",
          caloriePortion: `~${Math.round(calories * 0.28)} kcal`,
          keyNutrients: "High protein, fast & slow carbohydrates, healthy fats",
        },
        {
          meal: "Lunch",
          title: "Teriyaki Chicken & Brown Rice Power Bowl",
          description: "Generous serving of grilled marinated chicken breast, steamed brown rice, edamame beans, and roasted broccoli florets.",
          caloriePortion: `~${Math.round(calories * 0.32)} kcal`,
          keyNutrients: "Leucine, complex carbs, iron, B-vitamins",
        },
        {
          meal: "Dinner",
          title: "Lean Steak or Tofu Stir-Fry with Soba Noodles",
          description: "Stir-fried lean steak strips or firm tofu cubes with soba noodles, bok choy, bell peppers, and sesame seeds.",
          caloriePortion: `~${Math.round(calories * 0.28)} kcal`,
          keyNutrients: "Creatine precursors, zinc, bioavailable protein",
        },
        {
          meal: "Snacks & Pre/Post Workout",
          title: "Post-Workout Protein Smoothie with Berries",
          description: "Blend 1 scoop protein powder, 1 cup almond milk, 1 cup frozen berries, 1 tbsp ground flaxseeds, and a handful of spinach.",
          caloriePortion: `~${Math.round(calories * 0.12)} kcal`,
          keyNutrients: "Fast amino acid uptake, glycogen synthesis",
        },
      ],
      foodsToLimit: [
        "Empty-calorie sugary snacks that displace nutrient-dense whole foods",
        "Excessive alcohol intake (hampers muscle protein synthesis and sleep quality)",
        "Overly greasy deep-fried foods that cause digestive sluggishness before workouts",
      ],
      hydrationTips:
        "Drink 500ml of water 1 hour before training, and replenish with electrolytes after intense, heavy lifting sessions.",
      wellnessPrinciples: [
        "Spread protein intake evenly across 3–4 meals (25–40g per feeding) to maximize muscle protein synthesis.",
        "Pair strength training with a consistent sleep schedule (7–9 hours nightly) for optimum growth hormone release.",
        "Track progressive overload in your exercises to stimulate continuous muscular adaptation.",
      ],
      medicalDisclaimer: COMMON_DISCLAIMER,
    };
  }

  if (goal === "endurance") {
    return {
      goalKey: "endurance",
      goalTitle: "Cardiovascular Endurance & Stamina",
      dailyCalorieGuidance: calories,
      macroDistribution: {
        protein: "20% (Tissue Repair)",
        carbs: "55–60% (Sustained Glycogen Fuel)",
        fats: "20–25% (Aerobic Mitochondrial Energy)",
      },
      recommendedCategories: [
        {
          name: "Sustained-Release Carbohydrates",
          iconName: "Wheat",
          description: "The primary metabolic currency for cardiovascular exercise and aerobic performance.",
          examples: ["Brown rice & wild rice", "Whole wheat bread & bagels", "Sweet potatoes", "Rolled & steel-cut oats", "Bananas & raisins"],
        },
        {
          name: "Lean Recovery Proteins",
          iconName: "Fish",
          description: "Repairs micro-tears in muscular fibers incurred during repetitive, high-impact cardiovascular sessions.",
          examples: ["Roasted turkey & chicken", "Eggs & liquid egg whites", "Tuna in water", "Lentils & chickpea curries"],
        },
        {
          name: "Electrolyte & Hydration Enhancers",
          iconName: "ShieldCheck",
          description: "Maintains optimal nerve impulse transmission and muscle contraction fluidity.",
          examples: ["Coconut water", "Watermelon & oranges", "Sodium & potassium-rich broth", "Himalayan mineral salt in meals"],
        },
        {
          name: "Nitric Oxide & Blood Flow Boosters",
          iconName: "Apple",
          description: "Enhances endothelial vasodilation and oxygen delivery to working muscles.",
          examples: ["Beetroot & beetroot juice", "Pomegranate arils", "Dark leafy greens", "Citrus fruits"],
        },
      ],
      mealPlanSuggestions: [
        {
          meal: "Breakfast",
          title: "Endurance Energy Oatmeal with Honey & Walnuts",
          description: "Warm oats with a drizzle of pure raw honey, sliced banana, crushed walnuts, and two soft-boiled eggs on the side.",
          caloriePortion: `~${Math.round(calories * 0.28)} kcal`,
          keyNutrients: "High-glycogen carbs, natural electrolytes, complete amino acids",
        },
        {
          meal: "Lunch",
          title: "Mediterranean Farro & Tuna Salad",
          description: "Farro or brown rice tossed with chunk light tuna, kalamata olives, cherry tomatoes, cucumbers, and olive oil vinaigrette.",
          caloriePortion: `~${Math.round(calories * 0.32)} kcal`,
          keyNutrients: "Complex starches, healthy fats, anti-inflammatory polyphenols",
        },
        {
          meal: "Dinner",
          title: "Turkey Marinara Whole Wheat Pasta",
          description: "Whole wheat penne pasta with lean ground turkey, oregano marinara sauce, and a side garden salad with lemon-oil dressing.",
          caloriePortion: `~${Math.round(calories * 0.28)} kcal`,
          keyNutrients: "Muscle glycogen reload, lycopene, lean protein",
        },
        {
          meal: "Snacks & Pre/Post Workout",
          title: "Banana with Almond Butter or Rice Cakes",
          description: "Ripe banana with 1 tbsp almond butter 45 minutes before cardiovascular training for rapid, digestible energy.",
          caloriePortion: `~${Math.round(calories * 0.12)} kcal`,
          keyNutrients: "Potassium, easily accessible glucose, magnesium",
        },
      ],
      foodsToLimit: [
        "Heavy high-fat, high-cream dishes within 2 hours of a cardio session (causes digestive distress)",
        "Carbonated beverages that cause gastric bloating during running or cycling",
        "Excessive artificial sweeteners that can disrupt gastrointestinal comfort",
      ],
      hydrationTips:
        "Hydrate consistently throughout the day. Target light straw-colored urine as an indicator of good hydration status.",
      wellnessPrinciples: [
        "Never begin a long endurance workout depleted of carbohydrates or fluids.",
        "Practice intra-workout sips of water on sessions exceeding 45 minutes.",
        "Incorporate cool-downs and yoga flows to protect cardiovascular vessels and joints.",
      ],
      medicalDisclaimer: COMMON_DISCLAIMER,
    };
  }

  if (goal === "flexibility") {
    return {
      goalKey: "flexibility",
      goalTitle: "Mobility & Joint Flexibility",
      dailyCalorieGuidance: calories,
      macroDistribution: {
        protein: "20–25% (Connective Tissue Elasticity)",
        carbs: "45–50% (Whole Food Energy)",
        fats: "25–30% (Anti-Inflammatory Joint Lubrication)",
      },
      recommendedCategories: [
        {
          name: "Anti-Inflammatory Joint Lubricators",
          iconName: "Fish",
          description: "Rich in omega-3 fatty acids to reduce chronic inflammatory cytokines in joints and tendons.",
          examples: ["Wild-caught salmon & sardines", "Walnuts & flaxseed oil", "Avocado", "Extra virgin cold-pressed olive oil"],
        },
        {
          name: "Collagen & Vitamin C Synergy Foods",
          iconName: "Apple",
          description: "Crucial for connective tissue synthesis, tendon strength, and cartilage maintenance.",
          examples: ["Bone broth or hydrolyzed collagen", "Bell peppers (high vitamin C)", "Strawberries & kiwis", "Broccoli & tomatoes"],
        },
        {
          name: "Natural Plant Spices & Herbs",
          iconName: "Flame",
          description: "Active bioflavonoids that modulate systemic joint stiffness.",
          examples: ["Turmeric with black pepper (curcumin)", "Fresh ginger root", "Green tea (EGCG)", "Garlic & rosemary"],
        },
        {
          name: "Hydrating Fruits & Leafy Greens",
          iconName: "ShieldCheck",
          description: "Maintains optimal fascia hydration and cellular fluid balance.",
          examples: ["Cucumbers & watermelon", "Dark leafy greens", "Celery stalks", "Chia seed gel"],
        },
      ],
      mealPlanSuggestions: [
        {
          meal: "Breakfast",
          title: "Golden Turmeric Chia Pudding with Papaya",
          description: "Chia seeds set in almond milk, infused with turmeric, ginger, and a dash of cinnamon, topped with fresh papaya chunks.",
          caloriePortion: `~${Math.round(calories * 0.25)} kcal`,
          keyNutrients: "Omega-3s, soluble fiber, papain proteolytic enzymes",
        },
        {
          meal: "Lunch",
          title: "Warm Lentil & Roasted Vegetable Nourish Bowl",
          description: "Simmered green lentils with roasted sweet potato, kale, beets, pumpkin seeds, and a golden tahini dressing.",
          caloriePortion: `~${Math.round(calories * 0.35)} kcal`,
          keyNutrients: "Plant protein, magnesium, nitrates, zinc",
        },
        {
          meal: "Dinner",
          title: "Steamed White Fish with Bok Choy & Ginger Broth",
          description: "Delicate white fish or silken tofu gently steamed over fragrant ginger-garlic bone broth with baby bok choy and brown jasmine rice.",
          caloriePortion: `~${Math.round(calories * 0.3)} kcal`,
          keyNutrients: "Bioavailable amino acids, gingerol, digestive soothing",
        },
        {
          meal: "Snacks & Pre/Post Workout",
          title: "Antioxidant Green Tea with Handful of Raw Almonds",
          description: "A freshly brewed cup of sencha green tea paired with 20 raw almonds for vitamin E and polyphenols.",
          caloriePortion: `~${Math.round(calories * 0.1)} kcal`,
          keyNutrients: "Catechins, vitamin E, healthy fats",
        },
      ],
      foodsToLimit: [
        "Highly processed trans fats and industrial seed oils (promotes systemic joint inflammation)",
        "Refined sugar crystals and high-fructose syrups",
        "Excessive caffeine late in the day that can dehydrate connective tissues and impair restorative sleep",
      ],
      hydrationTips:
        "Connective tissue and fascia require deep hydration to remain elastic. Sip room-temperature water or herbal tea consistently.",
      wellnessPrinciples: [
        "Pair mindful breathing and mudra practice with nutrient-rich plant hydration.",
        "Consume vitamin C alongside protein to support natural collagen synthesis for healthy tendons.",
        "Take movement breaks throughout the day to keep synovial fluid circulating through your joints.",
      ],
      medicalDisclaimer: COMMON_DISCLAIMER,
    };
  }

  // Default: General Fitness / Healthy Maintenance
  return {
    goalKey: "maintenance",
    goalTitle: "General Fitness & Vitality",
    dailyCalorieGuidance: calories,
    macroDistribution: {
      protein: "25% (Maintenance & Repair)",
      carbs: "45% (Whole Grains & Produce)",
      fats: "30% (Healthy Fats)",
    },
    recommendedCategories: [
      {
        name: "Balanced Whole-Food Proteins",
        iconName: "Fish",
        description: "Maintains muscle tone, immune function, and enzyme synthesis.",
        examples: ["Eggs & egg whites", "Chicken, turkey & lean cuts", "Fish & seafood", "Lentils, chickpeas & beans", "Greek yogurt & cottage cheese"],
      },
      {
        name: "Unprocessed Wholesome Carbs",
        iconName: "Wheat",
        description: "Provides steady everyday energy for work, workouts, and cognitive clarity.",
        examples: ["Brown & basmati rice", "Oats & whole grains", "Potatoes & root vegetables", "Fresh seasonal fruits"],
      },
      {
        name: "Protective Micronutrient Foods",
        iconName: "Apple",
        description: "Loaded with phytonutrients, vitamins, and minerals for long-term healthspan.",
        examples: ["Berries (blueberries, raspberries)", "Cruciferous greens (broccoli, kale)", "Colorful peppers & carrots", "Citrus fruits"],
      },
      {
        name: "Heart-Friendly Fats",
        iconName: "ShieldCheck",
        description: "Promotes cardiovascular health, brain cell membranes, and satiety.",
        examples: ["Extra virgin olive oil", "Avocados", "Mixed raw nuts", "Chia & pumpkin seeds"],
      },
    ],
    mealPlanSuggestions: [
      {
        meal: "Breakfast",
        title: "Two-Egg Veggie Scramble with Whole Grain Toast",
        description: "Scrambled pasture-raised eggs with baby spinach and mushrooms, served with 1 slice whole grain sourdough and sliced avocado.",
        caloriePortion: `~${Math.round(calories * 0.25)} kcal`,
        keyNutrients: "Choline, lutein, complex fiber, healthy monounsaturated fat",
      },
      {
        meal: "Lunch",
        title: "Grilled Chicken & Quinoa Mediterranean Bowl",
        description: "Herb-grilled chicken, fluffy quinoa, cherry tomatoes, cucumbers, feta cheese crumbles, and olive oil vinaigrette.",
        caloriePortion: `~${Math.round(calories * 0.35)} kcal`,
        keyNutrients: "Complete protein, potassium, gut-friendly fiber",
      },
      {
        meal: "Dinner",
        title: "Roast Salmon with Roasted Vegetables & Rice",
        description: "Baked salmon fillet accompanied by roasted sweet potatoes, zucchini rounds, and steamed basmati rice.",
        caloriePortion: `~${Math.round(calories * 0.3)} kcal`,
        keyNutrients: "Omega-3s, magnesium, vitamin B12",
      },
      {
        meal: "Snacks & Pre/Post Workout",
        title: "Apple Slices with Handful of Walnuts",
        description: "One crisp Honeycrisp apple paired with a small handful of raw walnuts for balanced midday energy.",
        caloriePortion: `~${Math.round(calories * 0.1)} kcal`,
        keyNutrients: "Fiber, vitamin C, brain-boosting omega-3s",
      },
    ],
    foodsToLimit: [
      "Heavy commercial packaged snacks loaded with sodium and preservatives",
      "High-sugar desserts and sweetened coffee drinks",
      "Ultra-processed deli meats high in synthetic nitrates",
    ],
    hydrationTips:
      "Maintain a steady water intake of 2.5 to 3 liters per day to support cognitive alertness and physical vitality.",
    wellnessPrinciples: [
      "Follow the 80/20 principle: focus 80% of your diet on wholesome unprocessed foods, allowing flexible enjoyment for the rest.",
      "Chew food slowly and practice mindful eating without television or screen distractions.",
      "Stay active throughout the day with regular walking and postural mobility breaks.",
    ],
    medicalDisclaimer: COMMON_DISCLAIMER,
  };
}
