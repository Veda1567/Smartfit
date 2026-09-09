"use client";

import React, { useState, useActionState } from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  Dumbbell,
  Flame,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Droplets,
  Compass,
  Check,
  Calculator,
} from "lucide-react";
import { saveOnboardingAction } from "@/app/actions/profile";
import {
  calculateBmi,
  estimateTargetCalories,
  generateFitnessGuidance,
  type ProfileActionState,
} from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface OnboardingWizardProps {
  initialProfile?: {
    age?: number | null;
    gender?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    fitnessGoal?: string | null;
    activityLevel?: string | null;
    targetCalories?: number | null;
  } | null;
  username: string;
}

const initialState: ProfileActionState = {};

export function OnboardingWizard({ initialProfile, username }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, formAction, pending] = useActionState(saveOnboardingAction, initialState);

  // Form fields
  const [heightCm, setHeightCm] = useState(
    initialProfile?.heightCm ? String(initialProfile.heightCm) : "175"
  );
  const [weightKg, setWeightKg] = useState(
    initialProfile?.weightKg ? String(initialProfile.weightKg) : "70"
  );
  const [age, setAge] = useState(
    initialProfile?.age ? String(initialProfile.age) : "24"
  );
  const [gender, setGender] = useState(initialProfile?.gender || "male");
  const [fitnessGoal, setFitnessGoal] = useState(initialProfile?.fitnessGoal || "weight_loss");
  const [activityLevel, setActivityLevel] = useState(initialProfile?.activityLevel || "moderate");
  const [targetCalories, setTargetCalories] = useState(
    initialProfile?.targetCalories ? String(initialProfile.targetCalories) : ""
  );

  // Client-side step validation errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Real-time calculations
  const parsedH = parseFloat(heightCm) || 0;
  const parsedW = parseFloat(weightKg) || 0;
  const parsedAge = parseInt(age, 10) || 0;
  const liveBmi = calculateBmi(parsedH, parsedW);

  // Estimated calories
  const autoEstimatedCalories = estimateTargetCalories({
    heightCm: parsedH > 0 ? parsedH : null,
    weightKg: parsedW > 0 ? parsedW : null,
    age: parsedAge > 0 ? parsedAge : null,
    gender,
    activityLevel,
    fitnessGoal,
  });

  const activeCalories = targetCalories ? parseInt(targetCalories, 10) : autoEstimatedCalories;

  // Real-time personalized guidance
  const guidance = generateFitnessGuidance({
    fitnessGoal,
    bmiCategory: liveBmi.category,
    bmi: liveBmi.bmi,
    activityLevel,
    gender,
    targetCalories: activeCalories,
    weightKg: parsedW,
  });

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!heightCm || isNaN(parsedH) || parsedH < 50 || parsedH > 300) {
      errors.heightCm = "Please enter a valid height between 50 and 300 cm.";
    }
    if (!weightKg || isNaN(parsedW) || parsedW < 20 || parsedW > 500) {
      errors.weightKg = "Please enter a valid weight between 20 and 500 kg.";
    }
    if (!age || isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      errors.age = "Please enter an age between 10 and 120 years.";
    }
    if (!gender) {
      errors.gender = "Please select your gender.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!fitnessGoal) {
      errors.fitnessGoal = "Please select a fitness goal.";
    }
    if (!activityLevel) {
      errors.activityLevel = "Please select an activity level.";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      if (!targetCalories && autoEstimatedCalories) {
        setTargetCalories(String(autoEstimatedCalories));
      }
      setStep(3);
    }
  };

  const getBmiBadgeVariant = (cat: string | null) => {
    switch (cat) {
      case "normal":
        return "brand";
      case "underweight":
      case "overweight":
        return "amber";
      case "obesity":
        return "rose";
      default:
        return "slate";
    }
  };

  const goalOptions = [
    {
      id: "weight_loss",
      title: "Weight & Fat Loss",
      desc: "Caloric burn circuits, metabolic conditioning, and lean muscle preservation.",
      icon: Flame,
      color: "text-amber-400",
    },
    {
      id: "muscle_gain",
      title: "Muscle Hypertrophy",
      desc: "Progressive resistance training, strength gains, and hypertrophy stimulus.",
      icon: Dumbbell,
      color: "text-brand-400",
    },
    {
      id: "endurance",
      title: "Cardio & Stamina",
      desc: "Cardiovascular resilience, tempo conditioning, and aerobic endurance.",
      icon: HeartPulse,
      color: "text-cyan-400",
    },
    {
      id: "flexibility",
      title: "Mobility & Yogic Flow",
      desc: "Thoracic mobility, yogic asanas, postural restoration, and joint health.",
      icon: Sparkles,
      color: "text-purple-400",
    },
    {
      id: "maintenance",
      title: "Total Vitality & Balance",
      desc: "Balanced conditioning, executive concentration, and mindful wellness.",
      icon: Target,
      color: "text-emerald-400",
    },
  ];

  const activityOptions = [
    {
      id: "sedentary",
      title: "Sedentary",
      desc: "Desk job, little to no formal daily exercise.",
      multiplier: "1.2× BMR",
    },
    {
      id: "light",
      title: "Light Activity",
      desc: "Light exercise or active walks 1–3 days per week.",
      multiplier: "1.375× BMR",
    },
    {
      id: "moderate",
      title: "Moderate Activity",
      desc: "Moderate intensity exercise 3–5 days per week.",
      multiplier: "1.55× BMR",
    },
    {
      id: "very_active",
      title: "Very Active",
      desc: "Intense daily exercise or physical labor 6–7 days.",
      multiplier: "1.725× BMR",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header & Step Tracker */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-400">
          <Compass className="h-3.5 w-3.5" />
          <span>Personalized Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Welcome to SmartFit, {username}!
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Let&apos;s build your customized profile to calculate your baseline BMI, estimate daily energy targets, and tailor your physical and cognitive roadmap.
        </p>

        {/* Stepper Indicator */}
        <div className="pt-4 flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              step === 1
                ? "border-brand-500 bg-brand-500/15 text-brand-300 font-bold"
                : step > 1
                ? "border-slate-700 bg-slate-900 text-brand-400"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px]">
              {step > 1 ? <Check className="h-3 w-3 text-brand-400" /> : "1"}
            </span>
            <span>Biometrics</span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-slate-800" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              step === 2
                ? "border-brand-500 bg-brand-500/15 text-brand-300 font-bold"
                : step > 2
                ? "border-slate-700 bg-slate-900 text-brand-400"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px]">
              {step > 2 ? <Check className="h-3 w-3 text-brand-400" /> : "2"}
            </span>
            <span>Goals & Habits</span>
          </div>

          <div className="h-0.5 w-4 sm:w-8 bg-slate-800" />

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              step === 3
                ? "border-brand-500 bg-brand-500/15 text-brand-300 font-bold"
                : "border-slate-800 bg-slate-900/50 text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px]">
              3
            </span>
            <span>Your Roadmap</span>
          </div>
        </div>
      </div>

      {/* Error alert from server */}
      {state.error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Form Container */}
      <form action={formAction} className="space-y-6">
        {/* Hidden inputs to preserve step values across server action */}
        <input type="hidden" name="heightCm" value={heightCm} />
        <input type="hidden" name="weightKg" value={weightKg} />
        <input type="hidden" name="age" value={age} />
        <input type="hidden" name="gender" value={gender} />
        <input type="hidden" name="fitnessGoal" value={fitnessGoal} />
        <input type="hidden" name="activityLevel" value={activityLevel} />
        <input
          type="hidden"
          name="targetCalories"
          value={targetCalories || (autoEstimatedCalories ? String(autoEstimatedCalories) : "")}
        />

        {/* STEP 1: BIOMETRICS & BODY SCAN */}
        {step === 1 && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand-400" />
                  Step 1: Core Biometrics & Screening
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your baseline measurements. We use standard WHO screening algorithms to calculate your BMI and baseline energy expenditure.
                </p>
              </div>

              {/* Height & Weight Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="step-heightCm">Height (cm)</Label>
                  <Input
                    id="step-heightCm"
                    type="number"
                    step="0.1"
                    min="50"
                    max="300"
                    placeholder="e.g. 175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    aria-invalid={Boolean(stepErrors.heightCm || state.fieldErrors?.heightCm)}
                  />
                  {(stepErrors.heightCm || state.fieldErrors?.heightCm) && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {stepErrors.heightCm || state.fieldErrors?.heightCm}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="step-weightKg">Weight (kg)</Label>
                  <Input
                    id="step-weightKg"
                    type="number"
                    step="0.1"
                    min="20"
                    max="500"
                    placeholder="e.g. 70"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    aria-invalid={Boolean(stepErrors.weightKg || state.fieldErrors?.weightKg)}
                  />
                  {(stepErrors.weightKg || state.fieldErrors?.weightKg) && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {stepErrors.weightKg || state.fieldErrors?.weightKg}
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time BMI Display Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">
                      Calculated Screening BMI
                    </div>
                    <div className="text-2xl font-black text-white">
                      {liveBmi.bmi !== null ? `${liveBmi.bmi} kg/m²` : "—"}
                    </div>
                  </div>
                </div>

                {liveBmi.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Classification:</span>
                    <Badge
                      variant={
                        getBmiBadgeVariant(liveBmi.category) as
                          | "brand"
                          | "amber"
                          | "rose"
                          | "slate"
                      }
                      className="capitalize text-xs font-semibold px-3 py-1"
                    >
                      {liveBmi.category}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Age & Gender Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="step-age">Age (years)</Label>
                  <Input
                    id="step-age"
                    type="number"
                    min="10"
                    max="120"
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    aria-invalid={Boolean(stepErrors.age || state.fieldErrors?.age)}
                  />
                  {(stepErrors.age || state.fieldErrors?.age) && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {stepErrors.age || state.fieldErrors?.age}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="step-gender">Biological Sex / Gender</Label>
                  <select
                    id="step-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 transition-all duration-200 focus:border-brand-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {(stepErrors.gender || state.fieldErrors?.gender) && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {stepErrors.gender || state.fieldErrors?.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Link
                  href="/dashboard"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Skip for now
                </Link>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  className="flex items-center gap-2"
                >
                  <span>Continue to Goals</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: GOALS & LIFESTYLE */}
        {step === 2 && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-400" />
                  Step 2: Primary Goal & Activity Level
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your fitness objective and current lifestyle activity level so we can generate your tailored workout regimen.
                </p>
              </div>

              {/* Goal Cards */}
              <div>
                <Label className="mb-3 block">Select Your Primary Fitness Goal</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goalOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = fitnessGoal === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setFitnessGoal(opt.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-brand-500/80 bg-brand-500/10 ring-1 ring-brand-500/30"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${opt.color}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">
                                {opt.title}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-brand-500 text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {(stepErrors.fitnessGoal || state.fieldErrors?.fitnessGoal) && (
                  <p className="mt-1.5 text-xs text-rose-400">
                    {stepErrors.fitnessGoal || state.fieldErrors?.fitnessGoal}
                  </p>
                )}
              </div>

              {/* Activity Level Selector */}
              <div>
                <Label className="mb-3 block">Current Daily Activity Level</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activityOptions.map((act) => {
                    const isSelected = activityLevel === act.id;
                    return (
                      <div
                        key={act.id}
                        onClick={() => setActivityLevel(act.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-brand-500/80 bg-brand-500/10 ring-1 ring-brand-500/30"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-white text-sm">
                            {act.title}
                          </div>
                          <Badge variant="slate" className="text-[10px]">
                            {act.multiplier}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">{act.desc}</p>
                      </div>
                    );
                  })}
                </div>
                {(stepErrors.activityLevel || state.fieldErrors?.activityLevel) && (
                  <p className="mt-1.5 text-xs text-rose-400">
                    {stepErrors.activityLevel || state.fieldErrors?.activityLevel}
                  </p>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNextStep}
                  className="flex items-center gap-2"
                >
                  <span>Review Roadmap</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: PERSONALIZED GUIDANCE REVIEW & CALORIE TARGET */}
        {step === 3 && (
          <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-400" />
                  Step 3: Your Personalized Roadmap
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Here is your science-backed guidance generated by SmartFit based on your BMI ({liveBmi.bmi ?? "—"}), fitness goal, and metabolic profile.
                </p>
              </div>

              {/* Guidance Headline Banner */}
              <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-slate-900 to-cyan-500/10 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="brand" className="text-xs uppercase tracking-wider">
                    Recommended Plan
                  </Badge>
                  <Badge variant="cyan" className="text-xs">
                    {guidance.weeklyFrequency}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {guidance.headline}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {guidance.summary}
                </p>
              </div>

              {/* Roadmap Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Routine Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold">
                    <Dumbbell className="h-4 w-4" />
                    <span>Regimen Focus</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {guidance.recommendedRoutine}
                  </div>
                  <p className="text-xs text-slate-400">
                    {guidance.activityTip}
                  </p>
                </div>

                {/* Hydration Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                    <Droplets className="h-4 w-4" />
                    <span>Recommended Hydration</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {guidance.hydrationTargetMl.toLocaleString()} ml / day
                  </div>
                  <p className="text-xs text-slate-400">
                    Customized to your body weight ({parsedW} kg) and activity demands.
                  </p>
                </div>
              </div>

              {/* Mindfulness & Cognitive Tip */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                  <span>Mindfulness & Mudra Recovery Integration</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {guidance.mindfulnessTip}
                </p>
              </div>

              {/* Calorie Target Section */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="step-targetCalories" className="font-semibold text-white">
                    Estimated Daily Energy Target (kcal)
                  </Label>
                  {autoEstimatedCalories && (
                    <button
                      type="button"
                      onClick={() => setTargetCalories(String(autoEstimatedCalories))}
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      <span>Recalculate ({autoEstimatedCalories} kcal)</span>
                    </button>
                  )}
                </div>

                <Input
                  id="step-targetCalories"
                  type="number"
                  min="500"
                  max="10000"
                  placeholder="e.g. 2150"
                  value={targetCalories || (autoEstimatedCalories ? String(autoEstimatedCalories) : "")}
                  onChange={(e) => setTargetCalories(e.target.value)}
                />
                <p className="text-xs text-slate-400">
                  {guidance.calorieAdvice}
                </p>
              </div>

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  disabled={pending}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={pending}
                  className="min-w-[180px] flex items-center gap-2"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Profile…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Complete Setup (+50 XP)</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
