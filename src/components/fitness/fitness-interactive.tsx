"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
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
  ArrowUpRight,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  LogIn,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { logWaterAction, resetWaterAction } from "@/app/actions/fitness";
import { logWorkoutSessionAction } from "@/app/actions/trainer";
import { getWorkoutRegimen, type ExerciseDetail } from "@/lib/workout-routines";
import type { SessionUser } from "@/lib/auth-constants";

interface FitnessInteractiveProps {
  session: SessionUser | null;
  initialData: {
    todayWaterMl: number;
    dailyTargetMl: number;
    todayCalories: number;
    todayWorkoutTitle: string | null;
    currentStreak: number;
    userGoal: string | null;
  };
}

export function FitnessInteractive({
  session,
  initialData,
}: FitnessInteractiveProps) {
  // Hydration state
  const [waterMl, setWaterMl] = useState(initialData.todayWaterMl);
  const targetWater = initialData.dailyTargetMl;
  const [isWaterPending, startWaterTransition] = useTransition();
  const [waterToast, setWaterToast] = useState<string | null>(null);

  // Workout state
  const [todayCalories, setTodayCalories] = useState(initialData.todayCalories);
  const [todayWorkoutTitle, setTodayWorkoutTitle] = useState(initialData.todayWorkoutTitle);
  const [isWorkoutLogging, setIsWorkoutLogging] = useState(false);
  const [workoutToast, setWorkoutToast] = useState<string | null>(null);

  // Get active regimen for exercises checklist
  const regimen = getWorkoutRegimen(initialData.userGoal);
  const activeDayRoutine = regimen.routines[0];
  const [completedExercises, setCompletedExercises] = useState<Record<number, boolean>>({});

  // =========================================================================
  // Interval Timer Engine (Web Audio API synthesis)
  // =========================================================================
  const [timerMode, setTimerMode] = useState<"hiit" | "tabata" | "sprint">("hiit");
  const [workSec, setWorkSec] = useState(45);
  const [restSec, setRestSec] = useState(15);
  const [totalRounds, setTotalRounds] = useState(8);

  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<"idle" | "work" | "rest" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (frequency: number, durationMs: number = 150) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted before gesture
    }
  };

  const setPreset = (preset: "hiit" | "tabata" | "sprint") => {
    setTimerMode(preset);
    setIsRunning(false);
    setPhase("idle");
    setCurrentRound(1);
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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && phase !== "finished" && phase !== "idle") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            // Countdown beep
            playBeep(440, 100);
          }

          if (prev <= 1) {
            // Transition phase
            if (phase === "work") {
              playBeep(880, 300); // High transition beep
              setPhase("rest");
              return restSec;
            } else if (phase === "rest") {
              if (currentRound < totalRounds) {
                playBeep(660, 250);
                setCurrentRound((r) => r + 1);
                setPhase("work");
                return workSec;
              } else {
                // Workout Finished!
                playBeep(1046.5, 500);
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
  }, [isRunning, phase, currentRound, totalRounds, workSec, restSec]);

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

  // Format timer MM:SS
  const formatTime = (secs: number) => {
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
      setWaterToast(`Logged +${amount} ml (Preview). Sign in to persist your water logs!`);
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
  // Workout Checklist & Logger
  // =========================================================================
  const toggleExerciseCheck = (idx: number) => {
    setCompletedExercises((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCompleteTodayWorkout = async () => {
    if (!session) {
      setWorkoutToast("Sign in to record your workout and earn +100 XP!");
      setTimeout(() => setWorkoutToast(null), 3500);
      return;
    }

    setIsWorkoutLogging(true);
    try {
      const res = await logWorkoutSessionAction({
        routineTitle: activeDayRoutine.dayTitle,
        durationMinutes: activeDayRoutine.estimatedDurationMin,
        estimatedCaloriesBurned: activeDayRoutine.estimatedCalories,
        notes: `Fitness checklist: ${activeDayRoutine.focus}`,
      });

      if (res.success) {
        setTodayWorkoutTitle(activeDayRoutine.dayTitle);
        setTodayCalories((prev) => prev + activeDayRoutine.estimatedCalories);
        setWorkoutToast(res.message || "Workout session logged! +100 XP awarded 🔥");
        // Mark all as done
        const allDone: Record<number, boolean> = {};
        activeDayRoutine.exercises.forEach((_, i) => (allDone[i] = true));
        setCompletedExercises(allDone);
        setTimeout(() => setWorkoutToast(null), 4000);
      }
    } catch {
      setWorkoutToast("Failed to log workout session.");
    } finally {
      setIsWorkoutLogging(false);
    }
  };

  const waterPercentage = Math.min(100, Math.round((waterMl / targetWater) * 100));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader
        category="General Fitness"
        title="Fitness Dashboard & Utility Tools"
        description="Monitor daily workout progression, manage hydration logs with reminders, and time your training intervals with precision."
      />

      {/* Guest Notice */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Interactive Utility Preview</h4>
              <p className="text-xs text-slate-300">
                You are currently in guest preview mode. Sign in to save your water intake, log workout sessions, and keep your streaks active!
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              <LogIn className="h-4 w-4 mr-1.5" /> Sign In
            </Button>
          </Link>
        </div>
      )}

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Workout"
          value={todayWorkoutTitle ? "Completed" : "Ready"}
          subtitle={todayWorkoutTitle || `${activeDayRoutine.dayTitle.split(":")[1] || activeDayRoutine.dayTitle} • ${activeDayRoutine.estimatedDurationMin}m`}
          icon={<Dumbbell className="h-5 w-5 text-brand-400" />}
          badgeText={todayWorkoutTitle ? "Logged" : "Active"}
          badgeVariant="brand"
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
          subtitle="Active exercise estimated"
          icon={<Flame className="h-5 w-5 text-amber-400" />}
          badgeText="Today"
          badgeVariant="amber"
        />
        <StatCard
          title="Fitness Streak"
          value={`${initialData.currentStreak} Days`}
          subtitle="+20 XP daily streak reward"
          icon={<Trophy className="h-5 w-5 text-purple-400" />}
          badgeText="Consistent"
          badgeVariant="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Water Tracker & Workout Routine */}
        <div className="lg:col-span-7 space-y-6">
          {/* Water Intake Tracker Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Water Hydration Tracker</h3>
                  <p className="text-xs text-slate-400">Daily Target: {targetWater} ml ({Math.round(targetWater / 250)} glasses)</p>
                </div>
              </div>
              <Badge variant={waterPercentage >= 100 ? "brand" : "cyan"}>
                {waterPercentage >= 100 ? "Goal Reached! 🔥" : "Hourly Reminders"}
              </Badge>
            </div>

            {/* Hydration Toast */}
            {waterToast && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300 flex items-center gap-2 animate-in fade-in">
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

            {/* Quick Log Glasses Grid */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleLogWater(250)}
                disabled={isWaterPending}
                className="flex items-center gap-1.5 text-slate-950 font-bold"
              >
                <Plus className="h-4 w-4" /> Log +250ml Glass
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleLogWater(500)}
                disabled={isWaterPending}
                className="flex items-center gap-1.5 font-semibold"
              >
                <Plus className="h-4 w-4 text-cyan-400" /> Log +500ml Bottle
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetWater}
                disabled={isWaterPending}
                className="text-slate-400 hover:text-white ml-auto text-xs"
              >
                Reset Today
              </Button>
            </div>
          </Card>

          {/* Today's Workout Routine Checklist */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{activeDayRoutine.dayTitle}</h3>
                  <Badge variant="brand">{regimen.goalTitle}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeDayRoutine.focus} • {activeDayRoutine.estimatedDurationMin} min • ~{activeDayRoutine.estimatedCalories} kcal
                </p>
              </div>
              <Badge variant="brand">Reward: +100 XP</Badge>
            </div>

            {/* Workout Toast */}
            {workoutToast && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-300 flex items-center gap-2 animate-in fade-in">
                <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                <span>{workoutToast}</span>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              {activeDayRoutine.exercises.map((ex, idx) => {
                const isDone = !!completedExercises[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleExerciseCheck(idx)}
                    className={`cursor-pointer flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isDone
                        ? "border-brand-500/30 bg-brand-500/5 text-slate-200"
                        : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isDone
                            ? "border-brand-400 bg-brand-500 text-slate-950"
                            : "border-slate-700 bg-slate-900"
                        }`}
                      >
                        {isDone && <CheckCircle2 className="h-4 w-4 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{ex.name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {ex.sets} sets {ex.reps ? `• ${ex.reps}` : ex.duration ? `• ${ex.duration}` : ""} • Rest {ex.restSec}s
                        </div>
                      </div>
                    </div>
                    <Badge variant={isDone ? "brand" : "slate"}>
                      {isDone ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {Object.values(completedExercises).filter(Boolean).length} of {activeDayRoutine.exercises.length} exercises checked
              </span>

              <Button
                variant="primary"
                onClick={handleCompleteTodayWorkout}
                disabled={isWorkoutLogging}
                className="w-full sm:w-auto font-bold text-slate-950 flex items-center gap-2"
              >
                {isWorkoutLogging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording Session...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Routine Done & Claim +100 XP
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Interval Timer Engine */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 p-6 text-center space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <CardTitle className="text-base">Exercise Interval Timer</CardTitle>
                <CardDescription>High-precision stopwatch & HIIT intervals</CardDescription>
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
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreset("hiit")}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
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
              className={`relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 transition-colors shadow-2xl ${
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
                <div className="text-4xl font-mono font-extrabold text-white tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest font-bold ${
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
                  className="flex items-center gap-2 text-slate-950 font-bold px-6"
                >
                  <Play className="h-4 w-4 fill-slate-950" /> Start
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handlePauseTimer}
                  className="flex items-center gap-2"
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

            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-slate-400 text-[10px]">Work</div>
                <div className="font-bold text-white">{workSec}s</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-slate-400 text-[10px]">Rest</div>
                <div className="font-bold text-white">{restSec}s</div>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-slate-400 text-[10px]">Rounds</div>
                <div className="font-bold text-white">
                  {currentRound} / {totalRounds}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
