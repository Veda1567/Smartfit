"use client";

import React, { useState } from "react";
import {
  X,
  Dumbbell,
  Flame,
  Clock,
  CheckCircle2,
  Trophy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { logWorkoutSessionAction } from "@/app/actions/trainer";
import type { WorkoutDayRoutine } from "@/lib/workout-routines";

interface WorkoutModalProps {
  routine: WorkoutDayRoutine | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onWorkoutLogged?: (title: string, xpEarned: number) => void;
}

export function WorkoutModal({
  routine,
  isOpen,
  onClose,
  isAuthenticated,
  onWorkoutLogged,
}: WorkoutModalProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedExercises, setCheckedExercises] = useState<Record<number, boolean>>({});

  if (!isOpen || !routine) return null;

  const toggleCheck = (idx: number) => {
    setCheckedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLogWorkout = async () => {
    if (!isAuthenticated) {
      setErrorMessage("Please sign in to log your workout and earn XP rewards.");
      return;
    }

    setIsLogging(true);
    setErrorMessage(null);

    try {
      const result = await logWorkoutSessionAction({
        routineTitle: routine.dayTitle,
        durationMinutes: routine.estimatedDurationMin,
        estimatedCaloriesBurned: routine.estimatedCalories,
        notes: `Focus: ${routine.focus}`,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Workout session logged successfully!");
        if (onWorkoutLogged) {
          onWorkoutLogged(routine.dayTitle, result.xpEarned || 100);
        }
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(result.error || "Failed to log workout.");
      }
    } catch {
      setErrorMessage("Network error while recording workout.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="brand">Workout Regimen</Badge>
              <span className="text-xs text-slate-400 font-medium">{routine.focus}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {routine.dayTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-0.5">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              <span>Duration</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-white">
              {routine.estimatedDurationMin} min
            </span>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-0.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Est. Burn</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-white">
              ~{routine.estimatedCalories} kcal
            </span>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs mb-0.5">
              <Trophy className="h-3.5 w-3.5 text-purple-400" />
              <span>Reward</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-brand-400">
              +100 XP
            </span>
          </div>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-brand-300 flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-brand-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Exercises List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-300">
              Exercise Breakdown ({routine.exercises.length})
            </span>
            <span>Tap to check off as you train</span>
          </div>

          <div className="space-y-3">
            {routine.exercises.map((ex, idx) => {
              const isChecked = !!checkedExercises[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isChecked
                      ? "border-brand-500/40 bg-brand-500/5 text-slate-200"
                      : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isChecked
                          ? "border-brand-400 bg-brand-500 text-slate-950"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">
                          {ex.name}
                        </span>
                        <Badge variant={isChecked ? "brand" : "slate"}>
                          {ex.sets} sets {ex.reps ? `• ${ex.reps}` : ex.duration ? `• ${ex.duration}` : ""}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {ex.instructions}
                      </p>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Rest: {ex.restSec}s between sets
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-slate-400 hover:text-white"
          >
            Close
          </Button>

          <Button
            variant="primary"
            onClick={handleLogWorkout}
            disabled={isLogging}
            className="w-full sm:w-auto font-bold text-slate-950 flex items-center justify-center gap-2"
          >
            {isLogging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging Session...
              </>
            ) : (
              <>
                <Dumbbell className="h-4 w-4" />
                Complete & Log Workout (+100 XP)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
