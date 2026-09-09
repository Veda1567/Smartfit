"use client";

import React, { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  X,
  Activity,
  Calculator,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  HeartPulse,
} from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";
import {
  calculateBmi,
  estimateTargetCalories,
  type ProfileActionState,
} from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface EditProfileModalProps {
  profile?: {
    age?: number | null;
    gender?: string | null;
    heightCm?: number | null;
    weightKg?: number | null;
    fitnessGoal?: string | null;
    activityLevel?: string | null;
    targetCalories?: number | null;
    currentBmi?: number | null;
    bmiCategory?: string | null;
  } | null;
}

const initialState: ProfileActionState = {};

export function EditProfileModal({ profile }: EditProfileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  // Form local state for live calculations
  const [heightCm, setHeightCm] = useState<string>(
    profile?.heightCm !== null && profile?.heightCm !== undefined
      ? String(profile.heightCm)
      : ""
  );
  const [weightKg, setWeightKg] = useState<string>(
    profile?.weightKg !== null && profile?.weightKg !== undefined
      ? String(profile.weightKg)
      : ""
  );
  const [age, setAge] = useState<string>(
    profile?.age !== null && profile?.age !== undefined ? String(profile.age) : ""
  );
  const [gender, setGender] = useState<string>(profile?.gender ?? "");
  const [fitnessGoal, setFitnessGoal] = useState<string>(profile?.fitnessGoal ?? "");
  const [activityLevel, setActivityLevel] = useState<string>(profile?.activityLevel ?? "");
  const [targetCalories, setTargetCalories] = useState<string>(
    profile?.targetCalories !== null && profile?.targetCalories !== undefined
      ? String(profile.targetCalories)
      : ""
  );

  // Reset local state when profile prop changes or when reopening
  useEffect(() => {
    if (isOpen) {
      setHeightCm(
        profile?.heightCm !== null && profile?.heightCm !== undefined
          ? String(profile.heightCm)
          : ""
      );
      setWeightKg(
        profile?.weightKg !== null && profile?.weightKg !== undefined
          ? String(profile.weightKg)
          : ""
      );
      setAge(
        profile?.age !== null && profile?.age !== undefined ? String(profile.age) : ""
      );
      setGender(profile?.gender ?? "");
      setFitnessGoal(profile?.fitnessGoal ?? "");
      setActivityLevel(profile?.activityLevel ?? "");
      setTargetCalories(
        profile?.targetCalories !== null && profile?.targetCalories !== undefined
          ? String(profile.targetCalories)
          : ""
      );
    }
  }, [isOpen, profile]);

  // Handle successful save: refresh router and auto-close modal after a brief moment
  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !pending) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending]);

  // Live BMI calculation
  const parsedH = parseFloat(heightCm);
  const parsedW = parseFloat(weightKg);
  const liveBmi = calculateBmi(parsedH, parsedW);

  // Auto-calculate suggested calories based on biometrics
  const handleAutoCalculateCalories = () => {
    const estimated = estimateTargetCalories({
      heightCm: parsedH,
      weightKg: parsedW,
      age: parseInt(age, 10),
      gender,
      activityLevel,
      fitnessGoal,
    });

    if (estimated) {
      setTargetCalories(String(estimated));
    }
  };

  const getBmiBadgeVariant = (category: string | null) => {
    switch (category) {
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

  return (
    <>
      {/* Edit Profile Trigger Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs cursor-pointer hover:border-brand-500/50"
      >
        <Settings className="h-3.5 w-3.5 text-brand-400" />
        <span>Edit Profile</span>
      </Button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => {
              if (!pending) setIsOpen(false);
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-black/80 z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h2 id="edit-profile-title" className="text-xl font-bold text-white">
                    Edit Profile & Biometrics
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Update your personal stats, body metrics, and fitness preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!pending) setIsOpen(false);
                }}
                disabled={pending}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Banner */}
            {state.success && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-300"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
                <span>{state.message ?? "Profile updated successfully!"}</span>
              </div>
            )}

            {/* General Error Banner */}
            {state.error && (
              <div
                role="alert"
                className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="space-y-5">
              {/* Row 1: Height and Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heightCm">Height (cm)</Label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    step="0.1"
                    min="50"
                    max="300"
                    placeholder="e.g. 175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    aria-invalid={Boolean(state.fieldErrors?.heightCm)}
                  />
                  {state.fieldErrors?.heightCm && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.heightCm}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    step="0.1"
                    min="20"
                    max="500"
                    placeholder="e.g. 70"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    aria-invalid={Boolean(state.fieldErrors?.weightKg)}
                  />
                  {state.fieldErrors?.weightKg && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.weightKg}
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time Live BMI Preview Card */}
              {liveBmi.bmi !== null && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-brand-400" />
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Calculated Screening BMI
                      </div>
                      <div className="text-sm font-bold text-white">
                        {liveBmi.bmi}{" "}
                        <span className="text-xs font-normal text-slate-400">kg/m²</span>
                      </div>
                    </div>
                  </div>
                  {liveBmi.category && (
                    <Badge
                      variant={
                        getBmiBadgeVariant(liveBmi.category) as
                          | "brand"
                          | "amber"
                          | "rose"
                          | "slate"
                      }
                      className="capitalize text-xs font-medium"
                    >
                      {liveBmi.category}
                    </Badge>
                  )}
                </div>
              )}

              {/* Row 2: Age and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="10"
                    max="120"
                    placeholder="e.g. 25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    aria-invalid={Boolean(state.fieldErrors?.age)}
                  />
                  {state.fieldErrors?.age && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.age}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 transition-all duration-200 focus:border-brand-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  {state.fieldErrors?.gender && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Fitness Goal & Activity Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fitnessGoal">Fitness Goal</Label>
                  <select
                    id="fitnessGoal"
                    name="fitnessGoal"
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 transition-all duration-200 focus:border-brand-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Select primary goal</option>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="endurance">Endurance</option>
                    <option value="flexibility">Flexibility</option>
                  </select>
                  {state.fieldErrors?.fitnessGoal && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.fitnessGoal}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="activityLevel">Activity Level</Label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 transition-all duration-200 focus:border-brand-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (desk job, low activity)</option>
                    <option value="light">Light (1-3 days exercise/week)</option>
                    <option value="moderate">Moderate (3-5 days exercise/week)</option>
                    <option value="very_active">Very Active (6-7 days intense)</option>
                  </select>
                  {state.fieldErrors?.activityLevel && (
                    <p className="mt-1.5 text-xs text-rose-400">
                      {state.fieldErrors.activityLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Target Daily Calories with Auto-calculate button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="targetCalories" className="mb-0">
                    Daily Calorie Target (kcal)
                  </Label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateCalories}
                    disabled={!parsedH || !parsedW || !age}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Estimate Target</span>
                  </button>
                </div>
                <Input
                  id="targetCalories"
                  name="targetCalories"
                  type="number"
                  min="500"
                  max="10000"
                  placeholder="e.g. 2200"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  aria-invalid={Boolean(state.fieldErrors?.targetCalories)}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional general estimate. Use &ldquo;Estimate Target&rdquo; to calculate using your biometrics.
                </p>
                {state.fieldErrors?.targetCalories && (
                  <p className="mt-1.5 text-xs text-rose-400">
                    {state.fieldErrors.targetCalories}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={pending}
                  className="min-w-[130px]"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
