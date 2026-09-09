"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Droplets,
  Flame,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  LogIn,
  AlertCircle,
  Utensils,
  TrendingUp,
  Activity,
  Heart,
  ShieldAlert,
  Apple,
  Fish,
  Wheat,
  ShieldCheck,
  Check,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { logWaterAction, resetWaterAction } from "@/app/actions/fitness";
import { logWorkoutSessionAction } from "@/app/actions/trainer";
import {
  generatePersonalizedWorkoutPlan,
  type WorkoutDayRoutine,
  type ExerciseDetail,
} from "@/lib/workout-routines";
import { getFoodGuidance, type GoalFoodGuidance } from "@/lib/food-guidance";
import type { SessionUser } from "@/lib/auth-constants";

export interface FitnessInitialData {
  profile: {
    age: number | null;
    gender: string | null;
    heightCm: number | null;
    weightKg: number | null;
    fitnessGoal: string | null;
    activityLevel: string | null;
    currentBmi: number | null;
    bmiCategory: string | null;
    targetCalories: number | null;
  } | null;
  isProfileIncomplete: boolean;

  todayWaterMl: number;
  dailyTargetMl: number;

  todayCaloriesBurned: number;
  todayWorkoutsCount: number;
  lastWorkoutTitle: string | null;
  weeklyWorkoutsCount: number;
  weeklyMinutesTrained: number;
  totalWorkoutsCount: number;

  currentStreak: number;
  totalXP: number;
  currentLevel: number;

  recentWorkoutSessions: Array<{
    id: string;
    routineTitle: string;
    durationMinutes: number;
    estimatedCaloriesBurned: number | null;
    completedAt: string;
    notes: string | null;
  }>;
  recentBmiRecords: Array<{
    id: string;
    weightKg: number;
    heightCm: number;
    bmi: number;
    recordedAt: string;
  }>;
}

interface FitnessInteractiveProps {
  session: SessionUser | null;
  initialData: FitnessInitialData;
}

export function FitnessInteractive({
  session,
  initialData,
}: FitnessInteractiveProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"workout" | "timer" | "nutrition" | "progress">("workout");

  // Hydration state
  const [waterMl, setWaterMl] = useState(initialData.todayWaterMl);
  const targetWater = initialData.dailyTargetMl;
  const [isWaterPending, startWaterTransition] = useTransition();
  const [waterToast, setWaterToast] = useState<string | null>(null);

  // Activity / Stats state
  const [todayCalories, setTodayCalories] = useState(initialData.todayCaloriesBurned);
  const [lastWorkoutTitle, setLastWorkoutTitle] = useState(initialData.lastWorkoutTitle);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(initialData.weeklyWorkoutsCount);
  const [recentSessions, setRecentSessions] = useState(initialData.recentWorkoutSessions);

  // Personalized Fitness Plan
  const personalizedPlan = generatePersonalizedWorkoutPlan({
    age: initialData.profile?.age,
    gender: initialData.profile?.gender,
    heightCm: initialData.profile?.heightCm,
    weightKg: initialData.profile?.weightKg,
    bmi: initialData.profile?.currentBmi,
    bmiCategory: initialData.profile?.bmiCategory,
    fitnessGoal: initialData.profile?.fitnessGoal,
    activityLevel: initialData.profile?.activityLevel,
  });

  // Food & Nutrition Guidance
  const foodGuidance: GoalFoodGuidance = getFoodGuidance({
    fitnessGoal: initialData.profile?.fitnessGoal,
    targetCalories: initialData.profile?.targetCalories,
    weightKg: initialData.profile?.weightKg,
    activityLevel: initialData.profile?.activityLevel,
  });

  // Active workout routine selection
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const activeRoutine: WorkoutDayRoutine =
    personalizedPlan.routines[selectedDayIdx] || personalizedPlan.routines[0];

  // Workout Tracking State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});
  const [trackedReps, setTrackedReps] = useState<Record<number, string>>({});
  const [isWorkoutLogging, setIsWorkoutLogging] = useState(false);
  const [workoutToast, setWorkoutToast] = useState<{ message: string; xp: number } | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);

  // Stopwatch for active workout
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutElapsedSec((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive]);

  // =========================================================================
  // Interval Timer Engine (Web Audio API synthesis)
  // =========================================================================
  const [timerMode, setTimerMode] = useState<"hiit" | "tabata" | "sprint" | "custom">("hiit");
  const [workSec, setWorkSec] = useState(45);
  const [restSec, setRestSec] = useState(15);
  const [totalRounds, setTotalRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<"idle" | "work" | "rest" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customTimerLabel, setCustomTimerLabel] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(
    (frequency: number, durationMs: number = 150) => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtxRef.current.currentTime + durationMs / 1000
        );
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + durationMs / 1000);
      } catch {
        // Audio context might be muted or awaiting user gesture
      }
    },
    [soundEnabled]
  );

  const setPreset = (preset: "hiit" | "tabata" | "sprint") => {
    setTimerMode(preset);
    setIsRunning(false);
    setPhase("idle");
    setCurrentRound(1);
    setCustomTimerLabel(null);
    if (preset === "tabata") {
      setWorkSec(20);
      setRestSec(10);
      setTotalRounds(8);
      setTimeLeft(20);
    } else if (preset === "sprint") {
      setWorkSec(30);
      setRestSec(30);
      setTotalRounds(6);
      setTimeLeft(30);
    } else {
      setWorkSec(45);
      setRestSec(15);
      setTotalRounds(8);
      setTimeLeft(45);
    }
  };

  // Quick load exercise duration or rest into timer
  const loadExerciseIntoTimer = (ex: ExerciseDetail, type: "work" | "rest") => {
    const sec = type === "work" ? ex.durationSec || 40 : ex.restSec || 30;
    setTimerMode("custom");
    setCustomTimerLabel(`${ex.name} (${type === "work" ? "Exercise" : "Rest Period"})`);
    setWorkSec(sec);
    setRestSec(ex.restSec || 30);
    setTotalRounds(ex.sets || 3);
    setCurrentRound(1);
    setTimeLeft(sec);
    setPhase("work");
    setIsRunning(true);
    setActiveTab("timer");
    playBeep(587.33, 150);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && phase !== "finished" && phase !== "idle") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            playBeep(440, 100); // Countdown beep
          }

          if (prev <= 1) {
            if (phase === "work") {
              playBeep(880, 300); // Transition to rest
              setPhase("rest");
              return restSec;
            } else if (phase === "rest") {
              if (currentRound < totalRounds) {
                playBeep(660, 250);
                setCurrentRound((r) => r + 1);
                setPhase("work");
                return workSec;
              } else {
                playBeep(1046.5, 500); // Finished
                setPhase("finished");
                setIsRunning(false);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, phase, currentRound, totalRounds, workSec, restSec, playBeep]);

  const handleStartTimer = () => {
    if (phase === "idle" || phase === "finished") {
      setPhase("work");
      setTimeLeft(workSec);
      setCurrentRound(1);
    }
    setIsRunning(true);
    playBeep(587.33, 150);
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setPhase("idle");
    setCurrentRound(1);
    setTimeLeft(workSec);
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // =========================================================================
  // Water Tracking Handlers
  // =========================================================================
  const handleLogWater = (amount: number) => {
    if (!session) {
      setWaterMl((prev) => prev + amount);
      setWaterToast(`Logged +${amount} ml (Guest Preview). Sign in to persist hydration logs!`);
      setTimeout(() => setWaterToast(null), 3000);
      return;
    }

    setWaterMl((prev) => prev + amount);
    startWaterTransition(async () => {
      const res = await logWaterAction(amount);
      if (res.success) {
        setWaterToast(res.message || `+${amount} ml logged!`);
        if (res.totalToday) setWaterMl(res.totalToday);
        setTimeout(() => setWaterToast(null), 3500);
      }
    });
  };

  const handleResetWater = () => {
    if (!session) {
      setWaterMl(0);
      return;
    }

    setWaterMl(0);
    startWaterTransition(async () => {
      await resetWaterAction();
      setWaterToast("Today's water logs reset.");
      setTimeout(() => setWaterToast(null), 2500);
    });
  };

  // =========================================================================
  // Workout Tracking & Completion Handlers
  // =========================================================================
  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutElapsedSec(0);
    setCompletedExercises({});
    setWorkoutToast(null);
    setWorkoutError(null);
  };

  const handleCancelWorkout = () => {
    if (confirm("Are you sure you want to cancel this active workout? Progress will not be saved.")) {
      setIsWorkoutActive(false);
      setWorkoutElapsedSec(0);
      setCompletedExercises({});
    }
  };

  const toggleExerciseCheck = (idx: number) => {
    setCompletedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFinishWorkout = async () => {
    if (!session) {
      setWorkoutError("Please sign in or create an account to record workout sessions and earn +100 XP.");
      setTimeout(() => setWorkoutError(null), 4000);
      return;
    }

    const completedCount = Object.values(completedExercises).filter(Boolean).length;
    if (completedCount === 0) {
      setWorkoutError("Please complete and check off at least one exercise before finishing.");
      setTimeout(() => setWorkoutError(null), 3500);
      return;
    }

    setIsWorkoutLogging(true);
    setWorkoutError(null);

    // Calculate duration in minutes (minimum 5 mins or elapsed)
    const elapsedMinutes = Math.max(
      5,
      Math.min(180, Math.round(workoutElapsedSec / 60) || activeRoutine.estimatedDurationMin)
    );

    try {
      const res = await logWorkoutSessionAction({
        routineTitle: activeRoutine.dayTitle,
        durationMinutes: elapsedMinutes,
        estimatedCaloriesBurned: activeRoutine.estimatedCalories,
        notes: `Focus: ${activeRoutine.focus} • Completed ${completedCount}/${activeRoutine.exercises.length} exercises`,
      });

      if (res.success) {
        setWorkoutToast({
          message: res.message || "Workout session saved to your fitness history!",
          xp: res.xpEarned || 0,
        });

        setLastWorkoutTitle(activeRoutine.dayTitle);
        setTodayCalories((prev) => prev + activeRoutine.estimatedCalories);
        setWeeklyWorkouts((prev) => prev + 1);

        // Add to recent sessions list
        setRecentSessions((prev) => [
          {
            id: `temp-${Date.now()}`,
            routineTitle: activeRoutine.dayTitle,
            durationMinutes: elapsedMinutes,
            estimatedCaloriesBurned: activeRoutine.estimatedCalories,
            completedAt: new Date().toISOString(),
            notes: `Completed ${completedCount}/${activeRoutine.exercises.length} exercises`,
          },
          ...prev.slice(0, 7),
        ]);

        setIsWorkoutActive(false);
        setWorkoutElapsedSec(0);
        setTimeout(() => setWorkoutToast(null), 5000);
      } else {
        setWorkoutError(res.error || "Failed to record workout session.");
      }
    } catch {
      setWorkoutError("Network error while recording workout session.");
    } finally {
      setIsWorkoutLogging(false);
    }
  };

  const waterPercentage = Math.min(100, Math.round((waterMl / targetWater) * 100));
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const exerciseProgressPercent = activeRoutine.exercises.length
    ? Math.round((completedCount / activeRoutine.exercises.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <SectionHeader
        category="Fitness Engine"
        title="Personalized Fitness Workspace"
        description="Tailored bodyweight routines, high-precision interval timers, goal-oriented calorie guidance, and real-time workout tracking."
      />

      {/* Guest Notice */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Fitness Engine (Guest Preview)</h4>
              <p className="text-xs text-slate-300">
                You are currently exploring in preview mode. Sign in to save your workout sessions, keep your daily streaks active, and track your BMI progress.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              <LogIn className="h-4 w-4 mr-1.5" /> Sign In / Register
            </Button>
          </Link>
        </div>
      )}

      {/* Incomplete Profile Callout Banner */}
      {session && initialData.isProfileIncomplete && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Incomplete Fitness Profile Detected</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Set up your height, weight, and fitness goal to unlock hyper-personalized workout volume, Mifflin-St Jeor daily energy expenditure calculations, and joint-friendly exercise modifications.
              </p>
            </div>
          </div>
          <Link href="/onboarding">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              Complete Onboarding <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Biometric & Calorie Screening Bar */}
      {initialData.profile && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <Activity className="h-4 w-4 text-brand-400" />
              <span className="text-slate-400">BMI:</span>
              <span className="font-bold text-white">{initialData.profile.currentBmi ?? "—"}</span>
              <Badge
                variant={
                  initialData.profile.bmiCategory === "normal"
                    ? "brand"
                    : initialData.profile.bmiCategory === "underweight"
                    ? "cyan"
                    : "amber"
                }
                className="capitalize text-[10px] ml-1"
              >
                {initialData.profile.bmiCategory ?? "General"}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-slate-400">Daily Calorie Target:</span>
              <span className="font-bold text-white">
                {initialData.profile.targetCalories
                  ? `~${initialData.profile.targetCalories.toLocaleString()} kcal/day`
                  : "Mifflin-St Jeor Pending"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <Dumbbell className="h-4 w-4 text-purple-400" />
              <span className="text-slate-400">Goal:</span>
              <span className="font-bold text-white capitalize">
                {(initialData.profile.fitnessGoal || "Maintenance").replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <Heart className="h-4 w-4 text-rose-400" />
              <span className="text-slate-400">Activity Level:</span>
              <span className="font-bold text-white capitalize">
                {(initialData.profile.activityLevel || "Moderate").replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Non-medical wellness guidance estimates</span>
          </div>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Workout"
          value={isWorkoutActive ? "Active" : lastWorkoutTitle ? "Completed" : "Ready"}
          subtitle={
            isWorkoutActive
              ? `Elapsed: ${formatSeconds(workoutElapsedSec)}`
              : lastWorkoutTitle || `${activeRoutine.dayTitle.split(":")[1] || activeRoutine.dayTitle} • ${activeRoutine.estimatedDurationMin}m`
          }
          icon={<Dumbbell className="h-5 w-5 text-brand-400" />}
          badgeText={isWorkoutActive ? "Tracking" : lastWorkoutTitle ? "Logged" : "Available"}
          badgeVariant={isWorkoutActive ? "amber" : lastWorkoutTitle ? "brand" : "slate"}
        />
        <StatCard
          title="Water Intake"
          value={`${waterMl} ml`}
          subtitle={`${Math.round(waterMl / 250)} of ${Math.round(targetWater / 250)} glasses logged`}
          icon={<Droplets className="h-5 w-5 text-cyan-400" />}
          badgeText={`${waterPercentage}% Goal`}
          badgeVariant="cyan"
        />
        <StatCard
          title="Calories Burned"
          value={`~${todayCalories} kcal`}
          subtitle="Estimated active exercise burn"
          icon={<Flame className="h-5 w-5 text-amber-400" />}
          badgeText="Today"
          badgeVariant="amber"
        />
        <StatCard
          title="Weekly Activity"
          value={`${weeklyWorkouts} Workouts`}
          subtitle={`Streak: ${initialData.currentStreak} Days (+20 XP/day)`}
          icon={<Trophy className="h-5 w-5 text-purple-400" />}
          badgeText="Consistent"
          badgeVariant="brand"
        />
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("workout")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "workout"
              ? "border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4" /> Today&apos;s Workout &amp; Tracking
        </button>

        <button
          onClick={() => setActiveTab("timer")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "timer"
              ? "border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Timer className="h-4 w-4" /> Exercise Interval Timer
        </button>

        <button
          onClick={() => setActiveTab("nutrition")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "nutrition"
              ? "border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Utensils className="h-4 w-4" /> Calorie &amp; Food Guidance
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "progress"
              ? "border-brand-500 text-brand-400 bg-brand-500/5 rounded-t-xl"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> Progress &amp; BMI History
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: WORKOUT ENGINE & INTERACTIVE TRACKER                           */}
      {/* ===================================================================== */}
      {activeTab === "workout" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Workout Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Days Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {personalizedPlan.routines.map((routine, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (!isWorkoutActive) {
                      setSelectedDayIdx(idx);
                      setCompletedExercises({});
                    }
                  }}
                  disabled={isWorkoutActive}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                    selectedDayIdx === idx
                      ? "border-brand-500/50 bg-brand-500/10 text-white shadow-sm"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
                  } ${isWorkoutActive ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  Day {routine.dayNumber}: {routine.focus.split("&")[0].trim()}
                </button>
              ))}
            </div>

            {/* Routine Details Card */}
            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-6">
              {/* Routine Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="brand">{personalizedPlan.goalTitle}</Badge>
                    <Badge variant="slate">{personalizedPlan.difficultyLevel}</Badge>
                    {personalizedPlan.lowImpactModifications && (
                      <Badge variant="amber" className="flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Joint-Safe Low Impact
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{activeRoutine.dayTitle}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeRoutine.focus} • {activeRoutine.estimatedDurationMin} mins • ~{activeRoutine.estimatedCalories} kcal • Target Heart Rate: {personalizedPlan.targetHeartRateZone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isWorkoutActive ? (
                    <Button
                      variant="primary"
                      onClick={handleStartWorkout}
                      className="font-bold text-slate-950 flex items-center gap-2 px-5"
                    >
                      <Play className="h-4 w-4 fill-slate-950" /> Start Workout
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleCancelWorkout}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Cancel Workout
                    </Button>
                  )}
                </div>
              </div>

              {/* Toast / Feedback Alert */}
              {workoutToast && (
                <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4 text-xs sm:text-sm text-brand-300 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-5 w-5 text-brand-400 shrink-0" />
                    <span>{workoutToast.message}</span>
                  </div>
                  {workoutToast.xp > 0 && (
                    <Badge variant="brand" className="text-xs font-extrabold px-3 py-1 shrink-0">
                      +{workoutToast.xp} XP 🔥
                    </Badge>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {workoutError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs sm:text-sm text-red-300 flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <span>{workoutError}</span>
                </div>
              )}

              {/* Active Workout Tracker Bar */}
              {isWorkoutActive && (
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3 animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-brand-400 animate-ping" />
                      <span className="font-bold text-white">Workout in Progress</span>
                      <span className="font-mono text-brand-400 font-extrabold">
                        {formatSeconds(workoutElapsedSec)}
                      </span>
                    </div>
                    <span className="text-slate-400">
                      Completed: {completedCount} / {activeRoutine.exercises.length} ({exerciseProgressPercent}%)
                    </span>
                  </div>
                  <Progress value={exerciseProgressPercent} variant="brand" />
                </div>
              )}

              {/* Exercises List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-slate-300">
                    Exercise Routine Breakdown ({activeRoutine.exercises.length} movements)
                  </span>
                  <span>{isWorkoutActive ? "Track reps & check off as you train" : "Click 'Start Workout' to track"}</span>
                </div>

                {activeRoutine.exercises.map((ex, idx) => {
                  const isDone = !!completedExercises[idx];
                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 transition-all ${
                        isDone
                          ? "border-brand-500/30 bg-brand-500/5 text-slate-200"
                          : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleExerciseCheck(idx)}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              isDone
                                ? "border-brand-400 bg-brand-500 text-slate-950"
                                : "border-slate-700 bg-slate-900 hover:border-slate-500"
                            }`}
                            aria-label={`Mark ${ex.name} ${isDone ? "pending" : "completed"}`}
                          >
                            {isDone && <Check className="h-4 w-4 stroke-[3]" />}
                          </button>

                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-white">{ex.name}</span>
                              <Badge variant={isDone ? "brand" : "slate"}>
                                {ex.sets} sets {ex.reps ? `• ${ex.reps}` : ex.duration ? `• ${ex.duration}` : ""}
                              </Badge>
                              <span className="text-[11px] text-slate-400">Rest: {ex.restSec}s</span>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                              {ex.instructions}
                            </p>

                            {/* Reps/Duration Tracking Notes during active workout */}
                            {isWorkoutActive && (
                              <div className="pt-2 flex items-center gap-3 text-xs">
                                <span className="text-slate-400">Reps/Notes:</span>
                                <input
                                  type="text"
                                  placeholder="e.g. 12 reps @ bodyweight"
                                  value={trackedReps[idx] || ""}
                                  onChange={(e) =>
                                    setTrackedReps((prev) => ({ ...prev, [idx]: e.target.value }))
                                  }
                                  className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Timer Load Button */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => loadExerciseIntoTimer(ex, ex.durationSec ? "work" : "rest")}
                          className="text-[11px] h-8 shrink-0 flex items-center gap-1.5"
                          title="Open in Interval Timer"
                        >
                          <Timer className="h-3.5 w-3.5 text-brand-400" />
                          <span className="hidden sm:inline">Time ({ex.durationSec || ex.restSec}s)</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Footer */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-white">Safety Note:</span> Rest between sets and maintain continuous nasal breathing.
                </div>

                {isWorkoutActive ? (
                  <Button
                    variant="primary"
                    onClick={handleFinishWorkout}
                    disabled={isWorkoutLogging}
                    className="w-full sm:w-auto font-bold text-slate-950 flex items-center gap-2 px-6"
                  >
                    {isWorkoutLogging ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Session...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Finish Workout &amp; Claim +100 XP
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleStartWorkout}
                    className="w-full sm:w-auto font-bold flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" /> Start This Workout
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Hydration & Safety Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            {/* Water Hydration Tracker Card */}
            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Hydration Tracker</h3>
                    <p className="text-xs text-slate-400">Target: {targetWater} ml ({Math.round(targetWater / 250)} glasses)</p>
                  </div>
                </div>
                <Badge variant={waterPercentage >= 100 ? "brand" : "cyan"}>
                  {waterPercentage >= 100 ? "Goal Met! 🔥" : `${waterPercentage}%`}
                </Badge>
              </div>

              {/* Toast */}
              {waterToast && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{waterToast}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Progress: {waterMl} / {targetWater} ml</span>
                  <span className="text-cyan-400 font-bold">{waterPercentage}%</span>
                </div>
                <Progress value={waterPercentage} variant="cyan" />
              </div>

              {/* Quick Log Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleLogWater(250)}
                  disabled={isWaterPending}
                  className="flex items-center gap-1.5 text-slate-950 font-bold"
                >
                  <Plus className="h-4 w-4" /> +250ml
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleLogWater(500)}
                  disabled={isWaterPending}
                  className="flex items-center gap-1.5 font-semibold"
                >
                  <Plus className="h-4 w-4 text-cyan-400" /> +500ml
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetWater}
                  disabled={isWaterPending}
                  className="text-slate-400 hover:text-white ml-auto text-xs"
                >
                  Reset
                </Button>
              </div>
            </Card>

            {/* Personalized Safety Guidelines */}
            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Movement Safety Standards</h3>
                  <p className="text-xs text-slate-400">Adapted for your profile &amp; biomechanics</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                {personalizedPlan.safetyGuidelines.map((guide, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-brand-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{guide}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: EXERCISE INTERVAL TIMER ENGINE                                 */}
      {/* ===================================================================== */}
      {activeTab === "timer" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 text-center space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <CardTitle className="text-lg">Exercise Interval Timer</CardTitle>
                <CardDescription>
                  {customTimerLabel || "High-precision interval stopwatch with audio cues"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={soundEnabled ? "Mute audio beeps" : "Enable audio beeps"}
                  title={soundEnabled ? "Audio cues active" : "Audio muted"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-brand-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                <Badge variant="amber">Audio Beeps</Badge>
              </div>
            </div>

            {/* Presets Toggle */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreset("hiit")}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  timerMode === "hiit"
                    ? "bg-slate-800 text-brand-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                HIIT (45/15)
              </button>
              <button
                type="button"
                onClick={() => setPreset("tabata")}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  timerMode === "tabata"
                    ? "bg-slate-800 text-brand-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tabata (20/10)
              </button>
              <button
                type="button"
                onClick={() => setPreset("sprint")}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  timerMode === "sprint"
                    ? "bg-slate-800 text-brand-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sprint (30/30)
              </button>
            </div>

            {/* Visual Stopwatch Dial */}
            <div
              className={`relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border-4 transition-colors shadow-2xl ${
                phase === "work"
                  ? "border-brand-500 bg-brand-500/5 shadow-brand-500/10"
                  : phase === "rest"
                  ? "border-cyan-500 bg-cyan-500/5 shadow-cyan-500/10"
                  : phase === "finished"
                  ? "border-purple-500 bg-purple-500/5"
                  : "border-slate-800 bg-slate-950"
              }`}
            >
              <div className="space-y-1">
                <div className="text-5xl font-mono font-extrabold text-white tracking-wider">
                  {formatSeconds(timeLeft)}
                </div>
                <div
                  className={`text-[11px] uppercase tracking-widest font-bold ${
                    phase === "work"
                      ? "text-brand-400 animate-pulse"
                      : phase === "rest"
                      ? "text-cyan-400 animate-pulse"
                      : phase === "finished"
                      ? "text-purple-400 font-extrabold"
                      : "text-slate-400"
                  }`}
                >
                  {phase === "idle"
                    ? "Ready"
                    : phase === "work"
                    ? "Work Interval 🔥"
                    : phase === "rest"
                    ? "Rest & Recover 💧"
                    : "Set Completed! 🎉"}
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={handleStartTimer}
                  className="flex items-center gap-2 text-slate-950 font-bold px-8"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Start
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handlePauseTimer}
                  className="flex items-center gap-2 px-8"
                >
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}

              <Button
                size="lg"
                variant="ghost"
                onClick={handleResetTimer}
                className="p-3 text-slate-400 hover:text-white"
                title="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Interval Configuration Overview */}
            <div className="grid grid-cols-3 gap-3 text-xs pt-4 border-t border-slate-800">
              <div className="rounded-xl bg-slate-800/60 p-3">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Work Interval</div>
                <div className="font-bold text-white text-base mt-0.5">{workSec}s</div>
              </div>
              <div className="rounded-xl bg-slate-800/60 p-3">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Rest Interval</div>
                <div className="font-bold text-white text-base mt-0.5">{restSec}s</div>
              </div>
              <div className="rounded-xl bg-slate-800/60 p-3">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider">Round Status</div>
                <div className="font-bold text-white text-base mt-0.5">
                  {currentRound} / {totalRounds}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CALORIE & NUTRITION GUIDANCE                                   */}
      {/* ===================================================================== */}
      {activeTab === "nutrition" && (
        <div className="space-y-6">
          {/* Calorie Breakdown & Macro Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="amber">Energy Guidance</Badge>
                  <Badge variant="brand">{foodGuidance.goalTitle}</Badge>
                </div>
                <h3 className="text-xl font-bold text-white">Daily Calorie &amp; Macro Balance</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated using the Mifflin-St Jeor equation factoring in BMR, activity level, and your fitness goal.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-5 py-3 text-right">
                <div className="text-xs text-amber-300 font-semibold">Estimated Daily Intake</div>
                <div className="text-2xl font-extrabold text-white">
                  ~{foodGuidance.dailyCalorieGuidance.toLocaleString()}{" "}
                  <span className="text-sm font-normal text-amber-300">kcal/day</span>
                </div>
              </div>
            </div>

            {/* Macro Distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Protein Target</div>
                <div className="text-sm font-bold text-white">{foodGuidance.macroDistribution.protein}</div>
                <p className="text-[11px] text-slate-400">Lean tissue synthesis &amp; muscle repair</p>
              </div>

              <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Carbohydrate Target</div>
                <div className="text-sm font-bold text-white">{foodGuidance.macroDistribution.carbs}</div>
                <p className="text-[11px] text-slate-400">Muscular glycogen &amp; daily energy fuel</p>
              </div>

              <div className="rounded-2xl bg-slate-800/60 p-4 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400 font-medium">Healthy Fats</div>
                <div className="text-sm font-bold text-white">{foodGuidance.macroDistribution.fats}</div>
                <p className="text-[11px] text-slate-400">Cell membrane &amp; hormone regulation</p>
              </div>
            </div>
          </Card>

          {/* Recommended Food Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {foodGuidance.recommendedCategories.map((cat, idx) => (
              <Card key={idx} className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
                    {cat.iconName === "Fish" ? (
                      <Fish className="h-5 w-5" />
                    ) : cat.iconName === "Wheat" ? (
                      <Wheat className="h-5 w-5" />
                    ) : cat.iconName === "Apple" ? (
                      <Apple className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.examples.map((item, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md bg-slate-800/90 px-2 py-0.5 text-[11px] text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Practical Goal Meal Suggestions */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Practical Meal Ideas for Your Goal</h3>
              <p className="text-xs text-slate-400">
                Simple, wholesome ideas tailored to support your physical training and daily energy demands.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodGuidance.mealPlanSuggestions.map((meal, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand">{meal.meal}</Badge>
                    <span className="text-xs text-amber-300 font-semibold">{meal.caloriePortion}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{meal.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{meal.description}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    <span className="text-slate-400 font-medium">Key Nutrients:</span> {meal.keyNutrients}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Foods to Limit & General Principles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" /> Foods to Moderate or Limit
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {foodGuidance.foodsToLimit.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-400" /> Hydration &amp; Mindful Habits
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{foodGuidance.hydrationTips}</p>
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-xs text-slate-400">
                {foodGuidance.wellnessPrinciples.map((principle, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-brand-400">•</span>
                    <span>{principle}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-400 leading-relaxed flex items-start gap-3">
            <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <span>{foodGuidance.medicalDisclaimer}</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PROGRESS TRACKING & BMI HISTORY                                */}
      {/* ===================================================================== */}
      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Progress Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-2 text-center">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Workouts Completed</div>
              <div className="text-3xl font-extrabold text-white">{initialData.totalWorkoutsCount}</div>
              <p className="text-xs text-brand-400">Sessions saved in database</p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-2 text-center">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Weekly Active Minutes</div>
              <div className="text-3xl font-extrabold text-white">{initialData.weeklyMinutesTrained}m</div>
              <p className="text-xs text-cyan-400">Trained in the past 7 days</p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-2 text-center">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gamification Level &amp; XP</div>
              <div className="text-3xl font-extrabold text-white">Level {initialData.currentLevel}</div>
              <p className="text-xs text-purple-400">{initialData.totalXP} Total XP Earned</p>
            </Card>
          </div>

          {/* Recent Workout Sessions Log */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Recent Completed Workouts</h3>
                <p className="text-xs text-slate-400">Historical sessions saved in your WorkoutSession record</p>
              </div>
              <Badge variant="brand">{recentSessions.length} Recorded</Badge>
            </div>

            {recentSessions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                <Dumbbell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                No workout sessions logged yet. Complete today&apos;s routine to begin tracking!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSessions.map((sessionItem) => (
                  <div
                    key={sessionItem.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{sessionItem.routineTitle}</div>
                        <div className="text-xs text-slate-400">
                          {sessionItem.notes || `${sessionItem.durationMinutes} min active duration`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 self-end sm:self-center">
                      <span className="text-amber-400 font-semibold">
                        ~{sessionItem.estimatedCaloriesBurned ?? 200} kcal
                      </span>
                      <span>{new Date(sessionItem.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* BMI History Record Log */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">BMI &amp; Weight Tracking History</h3>
                <p className="text-xs text-slate-400">From verified BmiRecord entries in your profile</p>
              </div>
              <Link href="/profile">
                <Button size="sm" variant="secondary" className="text-xs">
                  Update Weight / Edit Profile
                </Button>
              </Link>
            </div>

            {initialData.recentBmiRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                No BMI history records found. Complete your biometric profile to track changes over time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Height</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">BMI</th>
                      <th className="py-2.5 px-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {initialData.recentBmiRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(record.recordedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white">{record.heightCm} cm</td>
                        <td className="py-2.5 px-3 font-medium text-white">{record.weightKg} kg</td>
                        <td className="py-2.5 px-3 font-bold text-brand-400">{record.bmi}</td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              record.bmi < 18.5
                                ? "cyan"
                                : record.bmi < 25
                                ? "brand"
                                : record.bmi < 30
                                ? "amber"
                                : "rose"
                            }
                            className="text-[10px]"
                          >
                            {record.bmi < 18.5
                              ? "Underweight"
                              : record.bmi < 25
                              ? "Normal"
                              : record.bmi < 30
                              ? "Overweight"
                              : "Obesity"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
