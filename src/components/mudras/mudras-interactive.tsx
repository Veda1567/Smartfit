"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  ShieldAlert,
  Hand,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Info,
  Loader2,
  LogIn,
  Layers,
  Heart,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logMudraPracticeAction } from "@/app/actions/wellness";
import type { SessionUser } from "@/lib/auth-constants";

export interface MudraItem {
  key: string;
  name: string;
  tagline: string;
  traditionalFocus: string;
  howToPractice: string;
  suggestedDuration: string;
  defaultMinutes: number;
  bestTime: string;
  tag: string;
  badgeVariant: "brand" | "amber" | "cyan" | "purple" | "slate";
}

const MUDRAS_DATA: MudraItem[] = [
  {
    key: "gyan",
    name: "Gyan Mudra",
    tagline: "Mudra of Knowledge & Inner Peace",
    traditionalFocus: "Concentration, mental stillness, memory retention, and down-regulating nervous tension.",
    howToPractice:
      "Gently join the tip of your index finger to the tip of your thumb. Keep the remaining three fingers straight, relaxed, and parallel. Rest your wrists on your knees with palms facing upward.",
    suggestedDuration: "10 to 20 minutes daily",
    defaultMinutes: 10,
    bestTime: "Early morning meditation, deep reading, or quiet reflection",
    tag: "Focus & Wisdom",
    badgeVariant: "brand",
  },
  {
    key: "prana",
    name: "Prana Mudra",
    tagline: "Mudra of Vital Life-Force",
    traditionalFocus: "Awakening dormant physical vitality, clearing mental lethargy, and supporting visual endurance.",
    howToPractice:
      "Join the tips of your ring finger and little finger with the tip of your thumb. Keep your index and middle fingers extended comfortably without strain.",
    suggestedDuration: "10 to 15 minutes",
    defaultMinutes: 10,
    bestTime: "Morning energy activation or afternoon cognitive slump",
    tag: "Vitality & Energy",
    badgeVariant: "amber",
  },
  {
    key: "vayu",
    name: "Vayu Mudra",
    tagline: "Mudra of Air & Equanimity",
    traditionalFocus: "Traditional association with balancing the air element, easing joint restlessness, and calming tremors.",
    howToPractice:
      "Fold your index finger down so it presses against the fleshy base of the thumb mound. Place your thumb lightly over the first knuckle of the index finger.",
    suggestedDuration: "10 to 15 minutes",
    defaultMinutes: 10,
    bestTime: "Post-workout cool down or during quiet sitting",
    tag: "Balance & Ease",
    badgeVariant: "cyan",
  },
  {
    key: "shunya",
    name: "Shunya Mudra",
    tagline: "Mudra of Emptiness & Stillness",
    traditionalFocus: "Cultivating profound mental silence, reducing spatial sensory overload, and ear equilibrium.",
    howToPractice:
      "Bend your middle finger down so its tip touches the base of the thumb. Gently apply light downward pressure with your thumb over the second knuckle.",
    suggestedDuration: "10 to 15 minutes",
    defaultMinutes: 10,
    bestTime: "Evening wind-down or when feeling mentally overloaded",
    tag: "Quiet Stillness",
    badgeVariant: "purple",
  },
  {
    key: "surya",
    name: "Surya Mudra",
    tagline: "Mudra of Fire & Metabolic Tone",
    traditionalFocus: "Traditional association with warming the physical core, stimulating metabolic digestion, and dispelling sluggishness.",
    howToPractice:
      "Bend your ring finger to the base of the thumb. Place your thumb gently over the folded ring finger. Keep the other fingers extended.",
    suggestedDuration: "5 to 15 minutes",
    defaultMinutes: 5,
    bestTime: "Before morning workouts or 30 minutes after light meals",
    tag: "Metabolic Fire",
    badgeVariant: "amber",
  },
  {
    key: "apana",
    name: "Apana Mudra",
    tagline: "Mudra of Grounding & Release",
    traditionalFocus: "Promotes downward energetic grounding, abdominal ease, and mental purification.",
    howToPractice:
      "Bring the tips of your middle finger and ring finger together to meet the tip of your thumb. Keep index and pinky fingers relaxed and straight.",
    suggestedDuration: "10 to 15 minutes",
    defaultMinutes: 10,
    bestTime: "Evening reflection or after deep physical stretches",
    tag: "Grounding",
    badgeVariant: "slate",
  },
];

export interface MudrasInteractiveProps {
  session: SessionUser | null;
  initialData: {
    userMudraStats: Record<string, { practiceCount: number; totalMinutes: number }>;
  };
}

export function MudrasInteractive({
  session,
  initialData,
}: MudrasInteractiveProps) {
  // Practice Modal State
  const [activeMudra, setActiveMudra] = useState<MudraItem | null>(null);
  const [practiceDuration, setPracticeDuration] = useState(10);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isLogging, setIsLogging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userStats, setUserStats] = useState(initialData.userMudraStats);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Soft Singing Bowl Sound Synthesis
  const playChime = useCallback(() => {
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
      const now = audioCtxRef.current.currentTime;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now); // Gentle E4
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch {
      // Audio context might be restricted
    }
  }, [soundEnabled]);

  const openPracticeModal = (mudra: MudraItem) => {
    setActiveMudra(mudra);
    setPracticeDuration(mudra.defaultMinutes);
    setTimeLeft(mudra.defaultMinutes * 60);
    setIsRunning(false);
    setIsFinished(false);
    setToastMessage(null);
  };

  const closePracticeModal = () => {
    setActiveMudra(null);
    setIsRunning(false);
    setIsFinished(false);
  };

  const changeDuration = (mins: number) => {
    setPracticeDuration(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
    setIsFinished(false);
  };

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isFinished) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            setIsRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isFinished, playChime]);

  const handleStartTimer = () => {
    if (isFinished) {
      setTimeLeft(practiceDuration * 60);
      setIsFinished(false);
    }
    setIsRunning(true);
    playChime();
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(practiceDuration * 60);
  };

  const handleFinishPractice = async () => {
    if (!session || !activeMudra) {
      setToastMessage("Sign in to save your Mudra practice history and earn +30 XP!");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsLogging(true);
    try {
      const res = await logMudraPracticeAction({
        mudraKey: activeMudra.key,
        durationMinutes: practiceDuration,
      });

      if (res.success) {
        setToastMessage(res.message || "Mudra practice recorded! +30 XP awarded ✨");
        setUserStats((prev) => {
          const current = prev[activeMudra.key] || { practiceCount: 0, totalMinutes: 0 };
          return {
            ...prev,
            [activeMudra.key]: {
              practiceCount: current.practiceCount + 1,
              totalMinutes: current.totalMinutes + practiceDuration,
            },
          };
        });
        setTimeout(() => {
          setToastMessage(null);
          closePracticeModal();
        }, 2000);
      } else {
        setToastMessage(res.error || "Failed to log practice.");
      }
    } catch {
      setToastMessage("Network error while recording practice.");
    } finally {
      setIsLogging(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <SectionHeader
        category="Traditional Mindfulness"
        title="Yogic Mudras Practice Gallery"
        description="Explore classical hand gestures from traditional yogic heritage. Mindfully align fingers to anchor meditative posture and cultivate physical stillness."
      />

      {/* Non-Medical Practice Notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-400">Traditional Wellness Practice:</span>{" "}
          Yogic Mudras are traditional hand postures intended to support mindful focus, breathing cadence, and meditative stillness. They are not medical cures or clinical therapies for diseases.
        </div>
      </div>

      {/* Guest Notice */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Mudra Practice Timers (Guest Preview)</h4>
              <p className="text-xs text-slate-300">
                You can practice with any Mudra timer in guest mode. Sign in to save your practice counts, track minutes, and earn +30 XP!
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              Sign In to Track
            </Button>
          </Link>
        </div>
      )}

      {/* Mudras Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MUDRAS_DATA.map((mudra) => {
          const stats = userStats[mudra.key];
          return (
            <Card
              key={mudra.key}
              className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200 space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Hand className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-white">
                        {mudra.name}
                      </CardTitle>
                      <span className="text-[11px] text-slate-400">{mudra.tagline}</span>
                    </div>
                  </div>
                  <Badge variant={mudra.badgeVariant}>{mudra.tag}</Badge>
                </div>

                {/* Practice History Badge if user has practiced */}
                {stats && stats.practiceCount > 0 && (
                  <div className="rounded-lg bg-slate-950/70 border border-slate-800 px-2.5 py-1 text-[11px] text-brand-400 flex items-center justify-between">
                    <span>Practiced {stats.practiceCount} {stats.practiceCount === 1 ? "time" : "times"}</span>
                    <span>{stats.totalMinutes}m total</span>
                  </div>
                )}

                {/* How to Form & Traditional Focus */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-200">How to Form:</span>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{mudra.howToPractice}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-200">Traditional Focus:</span>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{mudra.traditionalFocus}</p>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-400">Best Time:</span> {mudra.bestTime}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>{mudra.suggestedDuration}</span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openPracticeModal(mudra)}
                  className="flex items-center gap-1 text-xs text-slate-950 font-bold"
                >
                  <Play className="h-3 w-3 fill-slate-950" /> Practice Timer (+30 XP)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Practice Timer Modal */}
      {activeMudra && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <Badge variant="amber">Yogic Mudra Practice</Badge>
                <h3 className="text-xl font-bold text-white mt-1">{activeMudra.name}</h3>
                <p className="text-xs text-slate-400">{activeMudra.tagline}</p>
              </div>
              <button
                onClick={closePracticeModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Hand Form Reminder */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-left text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400">Hand Position: </span>
              {activeMudra.howToPractice}
            </div>

            {/* Duration Selector */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-slate-400">Duration:</span>
              {[5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => changeDuration(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    practiceDuration === m
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {m} mins
                </button>
              ))}
            </div>

            {/* Circular Timer Dial */}
            <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 border-amber-500/30 bg-amber-500/5 shadow-2xl shadow-amber-500/10">
              <div className="space-y-1">
                <div className="text-4xl font-mono font-extrabold text-white tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-amber-400">
                  {isFinished ? "Practice Done ✨" : isRunning ? "Hold Gesture Still" : "Ready"}
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
                  <Play className="h-4 w-4 fill-slate-950" />
                  {isFinished ? "Practice Again" : "Start Practice"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handlePauseTimer}
                  className="flex items-center gap-2 px-6"
                >
                  <Pause className="h-4 w-4" /> Pause
                </Button>
              )}

              <Button
                size="lg"
                variant="ghost"
                onClick={handleResetTimer}
                className="p-3 text-slate-400 hover:text-white"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Toast Feedback */}
            {toastMessage && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-300 animate-in fade-in">
                {toastMessage}
              </div>
            )}

            {/* Finish Practice Action */}
            {isFinished && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleFinishPractice}
                  disabled={isLogging}
                  className="w-full font-bold text-slate-950 flex items-center justify-center gap-2"
                >
                  {isLogging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Practice &amp; Claim +30 XP
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
