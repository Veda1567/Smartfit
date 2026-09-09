"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Dumbbell,
  Droplets,
  Flame,
  Scale,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  Loader2,
  Check,
  LogIn,
  Bot,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { calculateBmi, estimateTargetCalories } from "@/lib/validations/profile";
import { getWorkoutRegimen, type WorkoutDayRoutine } from "@/lib/workout-routines";
import { updateTrainerGuidanceAction } from "@/app/actions/trainer";
import { WorkoutModal } from "./workout-modal";
import type { SessionUser } from "@/lib/auth-constants";

interface TrainerInteractiveProps {
  initialProfile: {
    heightCm?: number | null;
    weightKg?: number | null;
    age?: number | null;
    gender?: string | null;
    fitnessGoal?: string | null;
    activityLevel?: string | null;
    targetCalories?: number | null;
    currentBmi?: number | null;
    bmiCategory?: string | null;
  } | null;
  session: SessionUser | null;
  totalWorkoutsLogged: number;
}

export function TrainerInteractive({
  initialProfile,
  session,
  totalWorkoutsLogged,
}: TrainerInteractiveProps) {
  const [height, setHeight] = useState(
    initialProfile?.heightCm ? String(initialProfile.heightCm) : "175"
  );
  const [weight, setWeight] = useState(
    initialProfile?.weightKg ? String(initialProfile.weightKg) : "70"
  );
  const [age, setAge] = useState(
    initialProfile?.age ? String(initialProfile.age) : "24"
  );
  const [gender, setGender] = useState(initialProfile?.gender || "male");
  const [goal, setGoal] = useState(initialProfile?.fitnessGoal || "weight_loss");
  const [activity, setActivity] = useState(initialProfile?.activityLevel || "moderate");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutDayRoutine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Calculations
  const numHeight = Number(height);
  const numWeight = Number(weight);
  const numAge = Number(age);

  const { bmi: liveBmi, category: liveCategory } = calculateBmi(numHeight, numWeight);

  const liveTargetCalories = estimateTargetCalories({
    heightCm: numHeight,
    weightKg: numWeight,
    age: numAge,
    gender,
    activityLevel: activity,
    fitnessGoal: goal,
  });

  // Calculate Base BMR & TDEE
  let bmr = 0;
  if (numHeight > 0 && numWeight > 0 && numAge > 0) {
    if (gender === "male") {
      bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge + 5;
    } else if (gender === "female") {
      bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge - 161;
    } else {
      bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge - 78;
    }
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };
  const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.55));

  // BMI classification details
  const bmiDisplay = liveBmi ? liveBmi.toFixed(1) : "—";
  let categoryLabel = "Healthy / Normal Weight";
  let categoryBadgeVariant: "brand" | "cyan" | "amber" | "purple" = "brand";
  let progressValue = 50;
  let categoryAdvice =
    "Your weight is well-balanced for your stature. Emphasize progressive functional strength, joint mobility, and steady aerobic conditioning.";

  if (liveBmi) {
    if (liveBmi < 18.5) {
      categoryLabel = "Underweight";
      categoryBadgeVariant = "cyan";
      progressValue = Math.min(30, Math.max(10, (liveBmi / 18.5) * 30));
      categoryAdvice =
        "Your BMI suggests below standard range. Focus on nutrient-dense meals, steady caloric surplus, and progressive resistance training.";
    } else if (liveBmi < 25) {
      categoryLabel = "Normal / Healthy Weight";
      categoryBadgeVariant = "brand";
      progressValue = 30 + ((liveBmi - 18.5) / 6.5) * 35;
      categoryAdvice =
        "Your weight sits in a well-balanced screening range. Maintain a balanced whole-food diet, cardiovascular stamina, and regular resistance workouts.";
    } else if (liveBmi < 30) {
      categoryLabel = "Overweight";
      categoryBadgeVariant = "amber";
      progressValue = 65 + ((liveBmi - 25) / 5) * 20;
      categoryAdvice =
        "Slightly above reference range. A modest daily caloric deficit combined with consistent aerobic intervals and strength training will yield sustainable improvements.";
    } else {
      categoryLabel = "Obesity Range";
      categoryBadgeVariant = "purple";
      progressValue = Math.min(100, 85 + ((liveBmi - 30) / 10) * 15);
      categoryAdvice =
        "Consider low-impact cardiovascular routines (walking, cycling, swimming) paired with mindful portion control to support sustainable joint and metabolic health.";
    }
  }

  // Active workout regimen
  const activeRegimen = getWorkoutRegimen(goal);

  const handleUpdateGuidance = () => {
    if (!session) {
      setErrorMessage("Please sign in to save your personal trainer guidance to your profile.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("heightCm", height);
    formData.append("weightKg", weight);
    formData.append("age", age);
    formData.append("gender", gender);
    formData.append("fitnessGoal", goal);
    formData.append("activityLevel", activity);
    if (liveTargetCalories) {
      formData.append("targetCalories", String(liveTargetCalories));
    }

    startTransition(async () => {
      const result = await updateTrainerGuidanceAction(null, formData);
      if (result.success) {
        setStatusMessage(result.message || "Guidance updated successfully!");
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setErrorMessage(result.error || "Failed to update fitness guidance.");
      }
    });
  };

  const handleOpenRoutine = (routine: WorkoutDayRoutine) => {
    setSelectedRoutine(routine);
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Module A"
        title="Personal Fitness Trainer"
        description="Configure your biometric profile to view personalized body screening metrics, general caloric estimates, and customized workout regimens."
      />

      {/* AI Coach Studio Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-brand-500/20 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 text-slate-950 font-bold shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>SmartFit AI Wellness Coach</span>
              <Badge variant="brand" className="text-[10px] py-0 px-1.5 bg-brand-500/20 text-brand-400">
                Live Studio
              </Badge>
            </h4>
            <p className="text-xs text-slate-400">
              Get an automated daily synthesis combining your workout logs, hydration, mood check-ins, and chess puzzles.
            </p>
          </div>
        </div>
        <Link href="/coach">
          <Button size="sm" variant="outline" className="border-brand-500/40 text-brand-400 hover:bg-brand-500/10 whitespace-nowrap">
            Open AI Coach ↗
          </Button>
        </Link>
      </div>

      {/* Guest Banner if not logged in */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Guest Interactive Preview</h4>
              <p className="text-xs text-slate-300">
                You can test biometric calculations live. Sign in to save your metrics, log workout sessions, and earn XP!
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              <LogIn className="h-4 w-4 mr-1.5" /> Sign In to Save
            </Button>
          </Link>
        </div>
      )}

      {/* Status Notifications */}
      {statusMessage && (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-300 flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Biometric Questionnaire Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 p-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle>Biometric Profile</CardTitle>
                <Badge variant={session ? "brand" : "slate"}>
                  {session ? "Connected DB" : "Live Preview"}
                </Badge>
              </div>
              <CardDescription>
                Inputs used for screening and metabolic energy estimation
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="heightInput">Height (cm)</Label>
                  <Input
                    id="heightInput"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    min={50}
                    max={300}
                  />
                </div>
                <div>
                  <Label htmlFor="weightInput">Weight (kg)</Label>
                  <Input
                    id="weightInput"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    min={20}
                    max={500}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ageInput">Age</Label>
                  <Input
                    id="ageInput"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="24"
                    min={10}
                    max={120}
                  />
                </div>
                <div>
                  <Label htmlFor="genderSelect">Gender</Label>
                  <select
                    id="genderSelect"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="goalSelect">Primary Fitness Goal</Label>
                <select
                  id="goalSelect"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                >
                  <option value="weight_loss">Weight / Fat Loss</option>
                  <option value="muscle_gain">Strength & Muscle Tone</option>
                  <option value="maintenance">Healthy Weight Maintenance</option>
                  <option value="endurance">Cardiovascular Endurance</option>
                  <option value="flexibility">Flexibility & Joint Mobility</option>
                </select>
              </div>

              <div>
                <Label htmlFor="activitySelect">Daily Activity Level</Label>
                <select
                  id="activitySelect"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
                >
                  <option value="sedentary">Sedentary (Desk routine, minimal movement)</option>
                  <option value="light">Light Activity (1–2 days/week)</option>
                  <option value="moderate">Moderate Activity (3–5 days/week)</option>
                  <option value="very_active">High Activity (6–7 days/week)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleUpdateGuidance}
                  disabled={isPending}
                  className="w-full font-bold text-slate-950 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Guidance...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {session ? "Save Fitness Guidance (+30 XP)" : "Update Guidance (Preview)"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Screening Metric Disclaimer Card */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Medical Screening Boundary</span>
            </div>
            <p className="leading-relaxed">
              BMI and estimated caloric targets are mathematical approximations for general lifestyle screening. They do not account for individual bone density, muscle distribution, or clinical conditions. Consult a qualified professional for clinical diagnostic advice.
            </p>
          </div>
        </div>

        {/* Right Column: Calculations & Guidance Display */}
        <div className="lg:col-span-7 space-y-6">
          {/* BMI Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={categoryBadgeVariant}>Screening Metric</Badge>
                  <span className="text-xs text-slate-400">WHO Standard Formula</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Body Mass Index (BMI)
                </h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-400">{bmiDisplay}</span>
                <span className="text-xs font-semibold text-slate-400">kg/m²</span>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Classification:</span>
                <span className="font-bold text-brand-400">{categoryLabel}</span>
              </div>
              <Progress value={progressValue} variant="brand" />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Underweight (&lt;18.5)</span>
                <span>Normal (18.5–24.9)</span>
                <span>Overweight (25–29.9)</span>
                <span>Obesity (30+)</span>
              </div>
              <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                {categoryAdvice}
              </p>
            </div>
          </Card>

          {/* Metabolic & Calorie Guidance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              title="Est. Maintenance (TDEE)"
              value={tdee > 0 ? `~${tdee.toLocaleString()} kcal` : "—"}
              subtitle={`Base BMR ~${Math.round(bmr)} kcal`}
              icon={<Flame className="h-5 w-5 text-amber-400" />}
              badgeText="Daily Burn"
              badgeVariant="amber"
            />
            <StatCard
              title="Target Daily Intake"
              value={liveTargetCalories ? `~${liveTargetCalories.toLocaleString()} kcal` : "—"}
              subtitle={
                goal === "weight_loss"
                  ? "Modest deficit for gradual fat loss"
                  : goal === "muscle_gain"
                  ? "Modest surplus for lean muscle mass"
                  : "Calibrated for balanced maintenance"
              }
              icon={<Scale className="h-5 w-5 text-cyan-400" />}
              badgeText="Goal-Aligned"
              badgeVariant="cyan"
            />
          </div>

          {/* Tailored Workout Regimen */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Recommended Routine</h3>
                  <Badge variant="brand">{activeRegimen.goalTitle}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeRegimen.description}</p>
              </div>
              <Badge variant="cyan">{activeRegimen.frequency}</Badge>
            </div>

            <div className="space-y-3">
              {activeRegimen.routines.map((routine) => (
                <div
                  key={routine.dayNumber}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {routine.dayTitle}
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {routine.focus} • {routine.estimatedDurationMin} min • ~{routine.estimatedCalories} kcal
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenRoutine(routine)}
                    className="self-start sm:self-auto font-medium"
                  >
                    View Exercises ({routine.exercises.length})
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Workout Session Detail & Logger Modal */}
      <WorkoutModal
        routine={selectedRoutine}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isAuthenticated={!!session}
        onWorkoutLogged={(title, xp) => {
          setStatusMessage(`Completed: "${title}" • +${xp} XP awarded! 🔥 Check your dashboard & profile.`);
        }}
      />
    </div>
  );
}
