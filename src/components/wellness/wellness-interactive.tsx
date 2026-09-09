"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Activity,
  Moon,
  Sun,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Heart,
  Brain,
  Volume2,
  VolumeX,
  CheckCircle2,
  Check,
  AlertCircle,
  Loader2,
  Smile,
  Meh,
  Frown,
  Zap,
  Info,
  Phone,
  Hand,
  ChevronRight,
  Send,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import {
  recordWellnessCheckInAction,
  logBreathingSessionAction,
} from "@/app/actions/wellness";
import {
  getPersonalizedWellnessRecommendations,
  DAILY_WELLNESS_ROUTINE,
  type MoodType,
  type SleepQualityType,
  type WellnessRecommendation,
} from "@/lib/wellness";
import type { SessionUser } from "@/lib/auth-constants";

export interface WellnessInteractiveProps {
  session: SessionUser | null;
  initialData: {
    todayCheckIn: {
      id: string;
      mood: string;
      stressLevel: number;
      energyLevel: number;
      sleepQuality: string;
      notes: string | null;
      checkedInAt: string;
    } | null;
    totalMeditationSessions: number;
    totalMeditationMinutes: number;
    totalMudrasPracticed: number;
    currentStreak: number;
    recentCheckIns: Array<{
      id: string;
      mood: string;
      stressLevel: number;
      energyLevel: number;
      sleepQuality: string;
      checkedInAt: string;
    }>;
  };
}

export function WellnessInteractive({
  session,
  initialData,
}: WellnessInteractiveProps) {
  // Check-In Form State
  const [mood, setMood] = useState<MoodType>(
    (initialData.todayCheckIn?.mood as MoodType) || "good"
  );
  const [stressLevel, setStressLevel] = useState<number>(
    initialData.todayCheckIn?.stressLevel ?? 2
  );
  const [energyLevel, setEnergyLevel] = useState<number>(
    initialData.todayCheckIn?.energyLevel ?? 3
  );
  const [sleepQuality, setSleepQuality] = useState<SleepQualityType>(
    (initialData.todayCheckIn?.sleepQuality as SleepQualityType) || "good"
  );
  const [notes, setNotes] = useState<string>(initialData.todayCheckIn?.notes || "");
  const [isCheckInPending, startCheckInTransition] = useTransition();
  const [checkInFeedback, setCheckInFeedback] = useState<{ message: string; xp: number } | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(!!initialData.todayCheckIn);

  // Recommendations derived from check-in state
  const recommendations: WellnessRecommendation = getPersonalizedWellnessRecommendations({
    mood,
    stressLevel,
    energyLevel,
    sleepQuality,
  });

  // =========================================================================
  // Guided Breathing Engine (Visual + Audio Synthesis)
  // =========================================================================
  const [breathingPattern, setBreathingPattern] = useState<"box" | "4-7-8">("box");
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold After Exhale">("Inhale");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [currentCycle, setCurrentCycle] = useState(1);
  const targetCycles = breathingPattern === "box" ? 4 : 5;
  const [isBreathingFinished, setIsBreathingFinished] = useState(false);
  const [isLoggingBreathing, setIsLoggingBreathing] = useState(false);
  const [breathingFeedback, setBreathingFeedback] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((frequency: number, durationMs: number = 200) => {
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
      gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted
    }
  }, [soundEnabled]);

  // Breathing Phase Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isBreathingRunning && !isBreathingFinished) {
      timer = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition phases
            if (breathingPattern === "box") {
              // 4s Inhale -> 4s Hold -> 4s Exhale -> 4s Hold
              if (breathingPhase === "Inhale") {
                setBreathingPhase("Hold");
                playTone(523.25, 250); // C5
                return 4;
              } else if (breathingPhase === "Hold") {
                setBreathingPhase("Exhale");
                playTone(440, 250); // A4
                return 4;
              } else if (breathingPhase === "Exhale") {
                setBreathingPhase("Hold After Exhale");
                playTone(392, 250); // G4
                return 4;
              } else {
                // Completed one cycle
                if (currentCycle < targetCycles) {
                  setCurrentCycle((c) => c + 1);
                  setBreathingPhase("Inhale");
                  playTone(523.25, 300);
                  return 4;
                } else {
                  // Finished all cycles
                  setIsBreathingFinished(true);
                  setIsBreathingRunning(false);
                  playTone(659.25, 500); // E5
                  return 0;
                }
              }
            } else {
              // 4-7-8 Breathing: 4s Inhale -> 7s Hold -> 8s Exhale
              if (breathingPhase === "Inhale") {
                setBreathingPhase("Hold");
                playTone(523.25, 250);
                return 7;
              } else if (breathingPhase === "Hold") {
                setBreathingPhase("Exhale");
                playTone(392, 250);
                return 8;
              } else {
                if (currentCycle < targetCycles) {
                  setCurrentCycle((c) => c + 1);
                  setBreathingPhase("Inhale");
                  playTone(523.25, 300);
                  return 4;
                } else {
                  setIsBreathingFinished(true);
                  setIsBreathingRunning(false);
                  playTone(659.25, 500);
                  return 0;
                }
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingRunning, isBreathingFinished, breathingPhase, breathingPattern, currentCycle, targetCycles, playTone]);

  const handleStartBreathing = () => {
    setIsBreathingRunning(true);
    setIsBreathingFinished(false);
    setBreathingPhase("Inhale");
    setPhaseSecondsLeft(4);
    setCurrentCycle(1);
    setBreathingFeedback(null);
    playTone(523.25, 200);
  };

  const handlePauseBreathing = () => {
    setIsBreathingRunning(false);
  };

  const handleResetBreathing = () => {
    setIsBreathingRunning(false);
    setIsBreathingFinished(false);
    setBreathingPhase("Inhale");
    setPhaseSecondsLeft(4);
    setCurrentCycle(1);
  };

  const handleLogBreathing = async () => {
    if (!session) {
      setBreathingFeedback("Sign in to save your breathwork practice and earn +30 XP!");
      setTimeout(() => setBreathingFeedback(null), 3500);
      return;
    }

    setIsLoggingBreathing(true);
    try {
      const res = await logBreathingSessionAction({
        pattern: breathingPattern,
        durationMinutes: breathingPattern === "box" ? 3 : 4,
        cyclesCompleted: targetCycles,
      });

      if (res.success) {
        setBreathingFeedback(res.message || "Breathing session logged! +30 XP awarded 🌿");
        setTimeout(() => setBreathingFeedback(null), 4000);
      }
    } catch {
      setBreathingFeedback("Failed to record breathwork.");
    } finally {
      setIsLoggingBreathing(false);
    }
  };

  // =========================================================================
  // Check-In Submit Handler
  // =========================================================================
  const handleSubmitCheckIn = () => {
    if (!session) {
      setCheckInError("Please sign in or create an account to record your daily check-in.");
      setTimeout(() => setCheckInError(null), 3500);
      return;
    }

    setCheckInError(null);
    startCheckInTransition(async () => {
      const res = await recordWellnessCheckInAction({
        mood,
        stressLevel,
        energyLevel,
        sleepQuality,
        notes,
      });

      if (res.success) {
        setCheckInFeedback({
          message: res.message || "Daily check-in saved!",
          xp: res.xpEarned || 0,
        });
        setHasCheckedInToday(true);
        setTimeout(() => setCheckInFeedback(null), 4500);
      } else {
        setCheckInError(res.error || "Failed to record check-in.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Section Header */}
      <SectionHeader
        category="Mental Wellness"
        title="Mindfulness & Self-Care Studio"
        description="Daily wellness check-ins, guided neuro-respiratory breathwork, restorative ambient meditation, and traditional mudras."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/meditation">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs font-semibold">
                <Layers className="h-4 w-4 text-cyan-400" /> Meditation Studio
              </Button>
            </Link>
            <Link href="/mudras">
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs font-semibold">
                <Hand className="h-4 w-4 text-amber-400" /> Yogic Mudras
              </Button>
            </Link>
          </div>
        }
      />

      {/* Guest Notice */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Mental Wellness Studio (Guest Preview)</h4>
              <p className="text-xs text-slate-300">
                You are currently exploring in preview mode. Sign in to save your daily mood check-ins, record completed meditation sessions, and maintain your wellness streaks.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              Sign In to Save Progress
            </Button>
          </Link>
        </div>
      )}

      {/* Distress / Crisis Support Banner (Displayed when acute stress is indicated) */}
      {recommendations.isHighDistress && recommendations.crisisSupportNotice && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-300 text-sm font-bold">
            <Phone className="h-5 w-5 text-rose-400 shrink-0" />
            <span>Support &amp; Care Resources</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            {recommendations.crisisSupportNotice}
          </p>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Check-In"
          value={hasCheckedInToday ? "Completed" : "Ready"}
          subtitle={
            hasCheckedInToday
              ? `Mood: ${mood.toUpperCase()} • Stress: ${stressLevel}/5`
              : "Check in today for +25 XP"
          }
          icon={<Heart className="h-5 w-5 text-rose-400" />}
          badgeText={hasCheckedInToday ? "Recorded" : "Available"}
          badgeVariant={hasCheckedInToday ? "brand" : "slate"}
        />
        <StatCard
          title="Meditation Minutes"
          value={`${initialData.totalMeditationMinutes} min`}
          subtitle={`${initialData.totalMeditationSessions} sessions completed`}
          icon={<Brain className="h-5 w-5 text-cyan-400" />}
          badgeText="Mindful"
          badgeVariant="cyan"
        />
        <StatCard
          title="Mudras Practiced"
          value={`${initialData.totalMudrasPracticed} Gestures`}
          subtitle="Physical stillness & awareness"
          icon={<Hand className="h-5 w-5 text-amber-400" />}
          badgeText="Traditional"
          badgeVariant="amber"
        />
        <StatCard
          title="Wellness Streak"
          value={`${initialData.currentStreak} Days`}
          subtitle="+20 XP daily streak consistency"
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          badgeText="Active"
          badgeVariant="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Daily Check-In & Guided Breathing */}
        <div className="lg:col-span-7 space-y-8">
          {/* Daily Wellness Check-In Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Daily Wellness Check-In</h3>
                  <Badge variant={hasCheckedInToday ? "brand" : "amber"}>
                    {hasCheckedInToday ? "Checked In Today" : "Pending Today"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reflect on your present emotional and physical state (+25 XP daily reward)
                </p>
              </div>
              <span className="text-[11px] text-slate-400">Non-Clinical Self-Assessment</span>
            </div>

            {/* Success / XP Feedback */}
            {checkInFeedback && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3.5 text-xs text-brand-300 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>{checkInFeedback.message}</span>
                </div>
                {checkInFeedback.xp > 0 && (
                  <Badge variant="brand" className="font-extrabold px-2.5 py-0.5">
                    +{checkInFeedback.xp} XP
                  </Badge>
                )}
              </div>
            )}

            {/* Error Banner */}
            {checkInError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{checkInError}</span>
              </div>
            )}

            {/* 1. Mood Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                1. How are you feeling today?
              </label>
              <div className="grid grid-cols-5 gap-2 text-center">
                {(
                  [
                    { key: "great", label: "Great", icon: "✨" },
                    { key: "good", label: "Good", icon: "😊" },
                    { key: "okay", label: "Okay", icon: "😐" },
                    { key: "low", label: "Low", icon: "🌧️" },
                    { key: "stressed", label: "Stressed", icon: "⚡" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMood(m.key)}
                    className={`py-2 px-1 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      mood === m.key
                        ? "border-brand-500/50 bg-brand-500/10 text-white shadow-sm"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-[11px] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Stress Level (1-5) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">2. Current Stress Level:</label>
                <span className="text-brand-400 font-bold">
                  {stressLevel === 1
                    ? "1 - Very Low / Calm"
                    : stressLevel === 2
                    ? "2 - Mild"
                    : stressLevel === 3
                    ? "3 - Moderate"
                    : stressLevel === 4
                    ? "4 - Elevated"
                    : "5 - High / Overwhelmed"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setStressLevel(lvl)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      stressLevel === lvl
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Energy Level (1-5) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">3. Physical &amp; Mental Energy:</label>
                <span className="text-cyan-400 font-bold">
                  {energyLevel === 1
                    ? "1 - Depleted / Exhausted"
                    : energyLevel === 2
                    ? "2 - Low"
                    : energyLevel === 3
                    ? "3 - Steady"
                    : energyLevel === 4
                    ? "4 - High"
                    : "5 - Peak Vitality"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      energyLevel === lvl
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sleep Quality */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                4. Last Night&apos;s Sleep Quality:
              </label>
              <div className="grid grid-cols-4 gap-2 text-center">
                {(
                  [
                    { key: "excellent", label: "Excellent" },
                    { key: "good", label: "Good" },
                    { key: "fair", label: "Fair" },
                    { key: "poor", label: "Poor" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSleepQuality(s.key)}
                    className={`py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      sleepQuality === s.key
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-300 font-bold"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Optional Private Note */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">
                  5. Personal Note (Private, Optional):
                </label>
                <span className="text-[11px] text-slate-400">{notes.length}/280</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                placeholder="Notice what you are carrying today... (Private to your profile)"
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button
                variant="primary"
                onClick={handleSubmitCheckIn}
                disabled={isCheckInPending}
                className="font-bold text-slate-950 flex items-center gap-2"
              >
                {isCheckInPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording Reflection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save Daily Check-In (+25 XP)
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Interactive Guided Breathing Engine Card */}
          <Card id="breathing" className="border-teal-500/30 bg-gradient-to-b from-teal-500/10 via-slate-900 to-slate-950 p-6 sm:p-8 text-center space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-left">
              <div>
                <Badge variant="brand">Guided Breathwork</Badge>
                <h3 className="text-xl font-bold text-white mt-1">Neuro-Respiratory Pacer</h3>
                <p className="text-xs text-slate-300">
                  {breathingPattern === "box"
                    ? "Box Breathing: 4s Inhale, 4s Hold, 4s Exhale, 4s Hold (Vagal Stimulation)"
                    : "4-7-8 Relaxation: 4s Inhale, 7s Hold, 8s Exhale (Parasympathetic Shift)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
                  title={soundEnabled ? "Audio cues active" : "Audio muted"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-brand-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                <Badge variant="cyan">Audio Bell</Badge>
              </div>
            </div>

            {/* Pattern Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  setBreathingPattern("box");
                  handleResetBreathing();
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  breathingPattern === "box"
                    ? "bg-slate-800 text-teal-300 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Box Breathing (4-4-4-4)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBreathingPattern("4-7-8");
                  handleResetBreathing();
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  breathingPattern === "4-7-8"
                    ? "bg-slate-800 text-teal-300 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                4-7-8 Sleep Pacer
              </button>
            </div>

            {/* Feedback Alert */}
            {breathingFeedback && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-300 flex items-center justify-center gap-2 animate-in fade-in">
                <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                <span>{breathingFeedback}</span>
              </div>
            )}

            {/* Dynamic Expanding/Contracting Breathing Visualizer */}
            <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border-4 border-teal-500/30 bg-teal-500/5 shadow-2xl shadow-teal-500/10">
              <div
                className={`flex flex-col items-center justify-center rounded-full border-2 transition-all duration-1000 ${
                  breathingPhase === "Inhale"
                    ? "h-44 w-44 border-teal-400 bg-teal-500/20 shadow-lg shadow-teal-500/30 scale-105"
                    : breathingPhase === "Hold" || breathingPhase === "Hold After Exhale"
                    ? "h-40 w-40 border-purple-400 bg-purple-500/20"
                    : "h-28 w-28 border-brand-400 bg-brand-500/10 scale-95"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
                  {breathingPhase}
                </span>
                <span className="text-3xl font-mono font-extrabold text-white mt-0.5">
                  {phaseSecondsLeft}s
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                  Cycle {currentCycle} of {targetCycles}
                </span>
              </div>
            </div>

            {/* Breathing Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isBreathingRunning ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartBreathing}
                  className="font-bold text-slate-950 px-8 flex items-center gap-2"
                >
                  <Play className="h-4 w-4 fill-slate-950" />
                  {isBreathingFinished ? "Repeat Session" : "Begin Guided Breathing"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handlePauseBreathing}
                  className="px-8 flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}

              <Button
                variant="ghost"
                size="lg"
                onClick={handleResetBreathing}
                className="p-3 text-slate-400 hover:text-white"
                title="Reset Cycles"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Completion & Claim Reward */}
            {isBreathingFinished && (
              <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4 space-y-2 animate-in fade-in">
                <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-400" />
                  <span>Breathing Practice Completed!</span>
                </div>
                <p className="text-xs text-slate-300">
                  You completed {targetCycles} cycles of {breathingPattern.toUpperCase()} breath regulation.
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleLogBreathing}
                    disabled={isLoggingBreathing}
                    className="font-bold text-slate-950"
                  >
                    {isLoggingBreathing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Recording...
                      </>
                    ) : (
                      <>Claim +30 XP Reward ✨</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Tailored Recommendations & Daily Routine */}
        <div className="lg:col-span-5 space-y-6">
          {/* Personalized Wellness Recommendations Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan">Adaptive Self-Care</Badge>
                <span className="text-[11px] text-slate-400">Based on Today&apos;s Check-In</span>
              </div>
              <h3 className="text-lg font-bold text-white">{recommendations.primaryHeadline}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {recommendations.supportiveMessage}
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Breathwork Suggestion */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300">
                    💨 {recommendations.recommendedBreathing.title}
                  </span>
                  <Badge variant="slate" className="text-[10px]">
                    {recommendations.recommendedBreathing.durationMinutes} min
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {recommendations.recommendedBreathing.description}
                </p>
              </div>

              {/* Meditation Suggestion */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">
                    🧘 {recommendations.recommendedMeditation.title}
                  </span>
                  <Link href="/meditation">
                    <Button size="sm" variant="ghost" className="h-6 text-[11px] text-cyan-400 hover:text-cyan-300 p-0">
                      Open Studio <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {recommendations.recommendedMeditation.description}
                </p>
              </div>

              {/* Mudra Suggestion */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    ✨ {recommendations.recommendedMudra.name}
                  </span>
                  <Link href="/mudras">
                    <Button size="sm" variant="ghost" className="h-6 text-[11px] text-amber-400 hover:text-amber-300 p-0">
                      Practice <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {recommendations.recommendedMudra.benefit}
                </p>
              </div>

              {/* Lifestyle Tip */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Daily Self-Care Tip:</strong> {recommendations.lifestyleTip}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{recommendations.nonMedicalDisclaimer}</span>
            </div>
          </Card>

          {/* Daily Wellness Routine Checklist */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Daily Wellness Routine</h3>
                <p className="text-xs text-slate-400">Integrated physical, mental, and recovery pacing</p>
              </div>
              <Badge variant="brand">Holistic Schedule</Badge>
            </div>

            <div className="space-y-3">
              {DAILY_WELLNESS_ROUTINE.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 space-y-1.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-400">{item.timeOfDay}:</span>
                      <span className="font-semibold text-white">{item.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.duration}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  <div className="flex justify-end pt-1">
                    <Link href={item.actionUrl}>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] text-brand-400 hover:text-white p-0">
                        {item.actionLabel} <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
