"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Clock,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Check,
  Brain,
  Moon,
  Sun,
  ShieldAlert,
  Loader2,
  LogIn,
  AlertCircle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { logMeditationSessionAction } from "@/app/actions/wellness";
import type { SessionUser } from "@/lib/auth-constants";

export interface MeditationInteractiveProps {
  session: SessionUser | null;
  initialData: {
    totalSessions: number;
    totalMinutes: number;
    recentSessions: Array<{
      id: string;
      sessionType: string;
      durationMinutes: number;
      soundscape: string | null;
      notes: string | null;
      completedAt: string;
    }>;
  };
}

interface MeditationItem {
  id: string;
  title: string;
  sessionType: string;
  durationMinutes: number;
  xpReward: number;
  description: string;
  badge: string;
  badgeVariant: "brand" | "cyan" | "purple" | "amber" | "slate";
}

const MEDITATION_CATALOG: MeditationItem[] = [
  {
    id: "breath_mindfulness",
    title: "Mindfulness of Breath",
    sessionType: "mindfulness",
    durationMinutes: 10,
    xpReward: 50,
    description: "Anchor attention onto the natural rhythm of breathing to settle an active racing mind.",
    badge: "Beginner Friendly",
    badgeVariant: "brand",
  },
  {
    id: "body_scan",
    title: "Body Scan for Stress Release",
    sessionType: "relaxation",
    durationMinutes: 15,
    xpReward: 50,
    description: "Progressively bring conscious awareness to each muscle group from head to toe, releasing stored tension.",
    badge: "Popular",
    badgeVariant: "cyan",
  },
  {
    id: "deep_sleep",
    title: "Deep Sleep & Evening Unwind",
    sessionType: "sleep",
    durationMinutes: 20,
    xpReward: 50,
    description: "Slow, calming visual pacing combined with ambient soundscapes to prepare your physiology for restorative rest.",
    badge: "Evening",
    badgeVariant: "purple",
  },
  {
    id: "cognitive_focus",
    title: "Cognitive Focus & Centering",
    sessionType: "focus",
    durationMinutes: 5,
    xpReward: 30,
    description: "A rapid cognitive centering exercise designed to precede deep work, study, or intense chess play.",
    badge: "Quick Focus",
    badgeVariant: "amber",
  },
  {
    id: "micro_reset",
    title: "2-Minute Micro-Pause Reset",
    sessionType: "mindfulness",
    durationMinutes: 2,
    xpReward: 20,
    description: "A brief mindfulness pause to unclench physical tension and reset breathing during a hectic workday.",
    badge: "Micro Session",
    badgeVariant: "slate",
  },
];

const SOUNDSCAPES = [
  "Gentle Rain",
  "Ocean Waves",
  "Tibetan Singing Bowls",
  "Forest Stream",
  "Pure Silence",
];

export function MeditationInteractive({
  session,
  initialData,
}: MeditationInteractiveProps) {
  const [selectedSession, setSelectedSession] = useState<MeditationItem>(MEDITATION_CATALOG[0]);
  const [selectedSoundscape, setSelectedSoundscape] = useState("Tibetan Singing Bowls");
  const [customMinutes, setCustomMinutes] = useState(selectedSession.durationMinutes);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(selectedSession.durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Persistence State
  const [isLogging, setIsLogging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState(initialData.recentSessions);
  const [totalMinutes, setTotalMinutes] = useState(initialData.totalMinutes);
  const [totalSessions, setTotalSessions] = useState(initialData.totalSessions);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Bell Chime Synthesis
  const playBowlChime = useCallback(() => {
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
      // Primary resonant tone (Tibetan bowl ~216 Hz & harmonic 432 Hz)
      const osc1 = audioCtxRef.current.createOscillator();
      const osc2 = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(216, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(432, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 3.0);
      osc2.stop(now + 3.0);
    } catch {
      // Audio context may be restricted
    }
  }, [soundEnabled]);

  // Handle session selection
  const selectMeditation = (item: MeditationItem) => {
    setSelectedSession(item);
    setCustomMinutes(item.durationMinutes);
    setTimeLeft(item.durationMinutes * 60);
    setIsRunning(false);
    setIsFinished(false);
    setToastMessage(null);
  };

  const handleCustomDuration = (mins: number) => {
    setCustomMinutes(mins);
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
            playBowlChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isFinished, playBowlChime]);

  const handleStartTimer = () => {
    if (isFinished) {
      setTimeLeft(customMinutes * 60);
      setIsFinished(false);
    }
    setIsRunning(true);
    playBowlChime();
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    setTimeLeft(customMinutes * 60);
  };

  const handleFinishAndLog = async () => {
    if (!session) {
      setToastMessage("Sign in to save your meditation session and claim XP rewards!");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsLogging(true);
    try {
      const res = await logMeditationSessionAction({
        sessionType: selectedSession.sessionType,
        title: selectedSession.title,
        durationMinutes: customMinutes,
        soundscape: selectedSoundscape,
        notes: sessionNotes.trim() || undefined,
      });

      if (res.success) {
        setToastMessage(res.message || "Meditation session logged successfully!");
        setTotalSessions((prev) => prev + 1);
        setTotalMinutes((prev) => prev + customMinutes);
        setRecentLogs((prev) => [
          {
            id: `temp-${Date.now()}`,
            sessionType: selectedSession.sessionType,
            durationMinutes: customMinutes,
            soundscape: selectedSoundscape,
            notes: sessionNotes.trim() || null,
            completedAt: new Date().toISOString(),
          },
          ...prev.slice(0, 5),
        ]);
        setSessionNotes("");
        setIsFinished(false);
        setTimeLeft(customMinutes * 60);
        setTimeout(() => setToastMessage(null), 4500);
      } else {
        setToastMessage(res.error || "Failed to log session.");
      }
    } catch {
      setToastMessage("Network error while recording meditation.");
    } finally {
      setIsLogging(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalDurationSecs = customMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.round(((totalDurationSecs - timeLeft) / totalDurationSecs) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader
        category="Mindfulness"
        title="Guided Meditation & Ambient Studio"
        description="Cultivate mental stillness, deepen introspective clarity, and unwind with soothing acoustic soundscapes and countdown timers."
      />

      {/* Guest Notice */}
      {!session && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Meditation Studio (Guest Preview)</h4>
              <p className="text-xs text-slate-300">
                You can practice with any timer in preview mode. Sign in to log your practice history, track total minutes, and earn +50 XP.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="text-slate-950 font-bold whitespace-nowrap">
              Sign In to Save
            </Button>
          </Link>
        </div>
      )}

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Meditations"
          value={`${totalSessions} Sessions`}
          subtitle="Mindfulness practices logged"
          icon={<Brain className="h-5 w-5 text-cyan-400" />}
          badgeText="Practice"
          badgeVariant="cyan"
        />
        <StatCard
          title="Mindful Minutes"
          value={`${totalMinutes} min`}
          subtitle="Total stillness recorded"
          icon={<Clock className="h-5 w-5 text-brand-400" />}
          badgeText="Stillness"
          badgeVariant="brand"
        />
        <StatCard
          title="Session Reward"
          value="+50 XP"
          subtitle="Earned on completion"
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          badgeText="Daily Reward"
          badgeVariant="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Meditation Studio & Timer */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 text-center space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={selectedSession.badgeVariant}>{selectedSession.badge}</Badge>
                  <span className="text-xs text-slate-400 uppercase font-semibold">
                    {selectedSession.sessionType}
                  </span>
                </div>
                <CardTitle className="text-xl">{selectedSession.title}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {selectedSession.description}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label={soundEnabled ? "Mute bell" : "Enable bell"}
                  title={soundEnabled ? "Singing bowl chime active" : "Audio muted"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-500" />
                  )}
                </button>
                <Badge variant="cyan">Bowl Chime</Badge>
              </div>
            </div>

            {/* Soundscape & Duration Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-slate-400">Ambient Sound:</span>
                <span className="font-semibold text-white">{selectedSoundscape}</span>
              </div>

              {/* Quick Duration Buttons */}
              <div className="flex items-center gap-1.5">
                {[2, 5, 10, 15, 20].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleCustomDuration(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      customMinutes === m
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Stopwatch Dial */}
            <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full border-4 border-cyan-500/30 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10">
              <div className="space-y-1">
                <div className="text-5xl font-mono font-extrabold text-white tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[11px] uppercase tracking-widest font-bold text-cyan-400">
                  {isFinished ? "Session Completed! ✨" : isRunning ? "Mindful Stillness 🧘" : "Ready to Begin"}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {progressPercent}% Elapsed
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
                  <Play className="h-4 w-4 fill-slate-950" />
                  {isFinished ? "Practice Again" : "Start Meditation"}
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
                title="Reset Session"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Toast Feedback */}
            {toastMessage && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3.5 text-xs text-brand-300 flex items-center justify-center gap-2 animate-in fade-in">
                <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Completion Form & Log Reward */}
            {isFinished && (
              <div className="rounded-2xl border border-brand-500/40 bg-brand-500/5 p-5 text-left space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-400" />
                  <h4 className="text-sm font-bold text-white">Meditation Finished!</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Take a slow, deep breath and gently return awareness to your surroundings. Notice the calm you cultivated.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] text-slate-400 font-semibold">
                    Post-Meditation Reflection (Optional):
                  </label>
                  <input
                    type="text"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="e.g. Felt settled, breathing felt deep and steady..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFinishAndLog}
                    disabled={isLogging}
                    className="font-bold text-slate-950"
                  >
                    {isLogging ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Recording Session...
                      </>
                    ) : (
                      <>Save Session &amp; Claim +50 XP ✨</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Catalog & Soundscapes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Soundscape Selector Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Volume2 className="h-4 w-4 text-cyan-400" /> Choose Acoustic Soundscape
              </span>
              <span className="text-[11px] text-slate-400">Ambient Background</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SOUNDSCAPES.map((sound) => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => setSelectedSoundscape(sound)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    selectedSoundscape === sound
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-bold"
                      : "border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white"
                  }`}
                >
                  {sound}
                </button>
              ))}
            </div>
          </Card>

          {/* Curated Sessions List */}
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white">Curated Mindfulness Practices</span>
              <span className="text-[11px] text-slate-400">{MEDITATION_CATALOG.length} Available</span>
            </div>

            <div className="space-y-2.5">
              {MEDITATION_CATALOG.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectMeditation(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedSession.id === item.id
                      ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                      : "border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold text-xs text-white">{item.title}</div>
                    <Badge variant={item.badgeVariant} className="text-[10px]">
                      {item.durationMinutes} min
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Meditation History */}
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-white">Recent Completed Sessions</span>
              <Badge variant="brand">{recentLogs.length} Logged</Badge>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No meditation sessions completed yet. Start your first session above!
              </div>
            ) : (
              <div className="space-y-2">
                {recentLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan-400" />
                      <span className="font-semibold text-white capitalize">{log.sessionType}</span>
                      <span className="text-slate-400">({log.durationMinutes}m)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
