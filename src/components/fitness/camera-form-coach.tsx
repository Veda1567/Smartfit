"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Info,
  ShieldCheck,
  Volume2,
  VolumeX,
  Flame,
  Activity,
  Loader2,
  Trophy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  createExerciseDetector,
  EXERCISE_CONFIGS,
  POSE_CONNECTIONS,
  calculateCameraSessionCalories,
  type ExerciseType,
  type IExerciseDetector,
  type PoseAnalysisResult,
  type NormalizedLandmark,
} from "@/lib/pose-analysis";
import { logCameraWorkoutSessionAction } from "@/app/actions/fitness";
import type { SessionUser } from "@/lib/auth-constants";

interface CameraFormCoachProps {
  session: SessionUser | null;
  userWeightKg?: number;
  onSessionLogged?: (sessionData: {
    id: string;
    routineTitle: string;
    durationMinutes: number;
    estimatedCaloriesBurned: number | null;
    completedAt: string;
    notes: string | null;
  }) => void;
}

export function CameraFormCoach({
  session,
  userWeightKg = 70,
  onSessionLogged,
}: CameraFormCoachProps) {
  // Exercise Selection
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>("squat");

  // Camera & Pipeline State
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Live Rep & Analysis Metrics
  const [analysisResult, setAnalysisResult] = useState<PoseAnalysisResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [repFlash, setRepFlash] = useState<"valid" | "warning" | null>(null);

  // Session Summary & Submission State
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{
    exercise: ExerciseType;
    durationSeconds: number;
    totalReps: number;
    correctReps: number;
    formWarnings: number;
    averageFormScore: number;
    caloriesBurned: number;
    xpEarned: number;
    message: string;
    unlockedAchievement?: string | null;
  } | null>(null);

  // Internal references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const detectorRef = useRef<IExerciseDetector | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const sessionStartTimeRef = useRef<number | null>(null);
  const formScoreHistoryRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);

  // Sync paused ref for requestAnimationFrame loop
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Audio synthesizer ding for rep feedback
  const playBeep = useCallback((type: "valid" | "warning" | "start") => {
    if (!audioFeedback || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "valid") {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "warning") {
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.setValueAtTime(261.63, now + 0.1); // C4
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {
      // Audio playback silently ignored if disabled by browser autoplay policies
    }
  }, [audioFeedback]);

  // Initialize or switch Exercise Detector
  useEffect(() => {
    detectorRef.current = createExerciseDetector(selectedExercise);
    formScoreHistoryRef.current = [];
    setAnalysisResult(null);
  }, [selectedExercise]);

  // Elapsed timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCameraActive && !isPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCameraActive, isPaused]);

  // Stop camera stream safely
  const stopCameraStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsPaused(false);
  }, []);

  // Clean unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (poseLandmarkerRef.current) {
        try {
          poseLandmarkerRef.current.close?.();
        } catch {
          // Ignore cleanup errors
        }
        poseLandmarkerRef.current = null;
      }
    };
  }, [stopCameraStream]);

  // Load MediaPipe PoseLandmarker once
  const ensurePoseLandmarker = async () => {
    if (poseLandmarkerRef.current) return poseLandmarkerRef.current;
    setIsModelLoading(true);

    try {
      const visionModule = await import("@mediapipe/tasks-vision");
      const { PoseLandmarker, FilesetResolver } = visionModule;

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      let landmarker;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch {
        // Fallback to CPU delegate if WebGL GPU not available
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      poseLandmarkerRef.current = landmarker;
      return landmarker;
    } finally {
      setIsModelLoading(false);
    }
  };

  // Draw Skeleton & Angles onto Canvas
  const renderPoseOverlay = (
    landmarks: NormalizedLandmark[],
    canvas: HTMLCanvasElement,
    res: PoseAnalysisResult
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // Draw skeletal connections
    ctx.lineWidth = 3;
    const connectionColor = res.issues.length > 0 ? "rgba(245, 158, 11, 0.75)" : "rgba(34, 197, 94, 0.75)";
    ctx.strokeStyle = connectionColor;

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (
        p1 &&
        p2 &&
        (p1.visibility ?? 1) >= 0.4 &&
        (p2.visibility ?? 1) >= 0.4
      ) {
        ctx.beginPath();
        // Video is mirrored horizontally for intuitive user reflection
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }
    }

    // Draw keypoints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p || (p.visibility ?? 1) < 0.4) continue;

      const px = (1 - p.x) * width;
      const py = p.y * height;

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = res.issues.length > 0 ? "#f59e0b" : "#22c55e";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }

    // Draw Angle Arc badge over canvas top-right
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = res.lastRepValid ? "rgba(34, 197, 94, 0.5)" : "rgba(245, 158, 11, 0.5)";
    ctx.lineWidth = 1.5;
    const badgeW = 120;
    const badgeH = 50;
    const badgeX = width - badgeW - 16;
    const badgeY = 16;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.fillText("CURRENT ANGLE", badgeX + 12, badgeY + 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`${res.currentAngle}°`, badgeX + 12, badgeY + 40);
    ctx.restore();
  };

  // Main real-time inference loop
  const runDetectionLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isPausedRef.current) {
      if (isCameraActive) {
        animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
      }

      const nowMs = performance.now();
      if (nowMs !== lastVideoTimeRef.current && poseLandmarkerRef.current) {
        lastVideoTimeRef.current = nowMs;

        try {
          const detection = poseLandmarkerRef.current.detectForVideo(video, nowMs);

          if (detection.landmarks && detection.landmarks.length > 0) {
            const rawLandmarks = detection.landmarks[0] as NormalizedLandmark[];

            if (detectorRef.current) {
              const res = detectorRef.current.analyze(rawLandmarks, Date.now());
              setAnalysisResult(res);

              if (res.isBodyVisible) {
                formScoreHistoryRef.current.push(res.formScore);
                if (formScoreHistoryRef.current.length > 300) {
                  formScoreHistoryRef.current.shift();
                }
              }

              // Rep completion trigger
              if (res.repJustCounted) {
                if (res.lastRepValid) {
                  setRepFlash("valid");
                  playBeep("valid");
                } else {
                  setRepFlash("warning");
                  playBeep("warning");
                }
                setTimeout(() => setRepFlash(null), 1200);
              }

              renderPoseOverlay(rawLandmarks, canvas, res);
            }
          } else {
            // No landmarks detected in frame
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        } catch {
          // Ignore occasional dropped frames
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
  }, [isCameraActive, playBeep]);

  // Start Camera Stream
  const handleStartCamera = async () => {
    setCameraError(null);
    setPermissionDenied(false);
    setSessionSummary(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your browser or environment.");
      return;
    }

    try {
      await ensurePoseLandmarker();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      sessionStartTimeRef.current = Date.now();
      detectorRef.current?.reset();
      formScoreHistoryRef.current = [];
      playBeep("start");

      animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Camera access error:", errorObj);
      if (errorObj.name === "NotAllowedError" || errorObj.name === "PermissionDeniedError") {
        setPermissionDenied(true);
        setCameraError("Camera permission was denied. Please allow camera access in your browser settings to use the form coach.");
      } else if (errorObj.name === "NotFoundError" || errorObj.name === "DevicesNotFoundError") {
        setCameraError("No video camera device was found on this device.");
      } else {
        setCameraError("Unable to initialize camera or AI vision pipeline. Please verify device permissions and try again.");
      }
      stopCameraStream();
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      if (!next && isCameraActive) {
        animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
      }
      return next;
    });
  };

  // Reset Session
  const handleResetSession = () => {
    detectorRef.current?.reset();
    setAnalysisResult(null);
    setElapsedSeconds(0);
    formScoreHistoryRef.current = [];
    sessionStartTimeRef.current = Date.now();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Finish and Save Session
  const handleFinishAndSave = async () => {
    const totalReps = analysisResult?.totalReps ?? 0;
    const correctReps = analysisResult?.correctReps ?? 0;
    const formWarnings = analysisResult?.formWarnings ?? 0;
    const currentElapsed = elapsedSeconds;

    // Stop camera immediately
    stopCameraStream();

    const avgScore =
      formScoreHistoryRef.current.length > 0
        ? Math.round(
            formScoreHistoryRef.current.reduce((a, b) => a + b, 0) /
              formScoreHistoryRef.current.length
          )
        : 85;

    const estimatedCalories = calculateCameraSessionCalories(
      selectedExercise,
      Math.max(0.5, currentElapsed / 60),
      totalReps,
      userWeightKg
    );

    if (!session) {
      // Guest Preview Summary
      setSessionSummary({
        exercise: selectedExercise,
        durationSeconds: currentElapsed,
        totalReps,
        correctReps,
        formWarnings,
        averageFormScore: avgScore,
        caloriesBurned: estimatedCalories,
        xpEarned: 0,
        message: "Session preview completed! Sign in to permanently log your reps and earn gamified XP.",
      });
      return;
    }

    setIsSavingSession(true);
    try {
      const res = await logCameraWorkoutSessionAction({
        exercise: selectedExercise,
        durationSeconds: currentElapsed,
        totalReps,
        correctReps,
        formWarnings,
        averageFormScore: avgScore,
      });

      if (res.success) {
        setSessionSummary({
          exercise: selectedExercise,
          durationSeconds: currentElapsed,
          totalReps,
          correctReps,
          formWarnings,
          averageFormScore: avgScore,
          caloriesBurned: estimatedCalories,
          xpEarned: res.xpEarned ?? 0,
          message: res.message || "AI Camera session successfully recorded!",
          unlockedAchievement: res.unlockedAchievement,
        });

        if (res.savedSession && onSessionLogged) {
          onSessionLogged(res.savedSession);
        }
      } else {
        setCameraError(res.error || "Failed to save camera workout session.");
      }
    } catch {
      setCameraError("Network error occurred while saving workout session.");
    } finally {
      setIsSavingSession(false);
    }
  };

  const exerciseConfig = EXERCISE_CONFIGS[selectedExercise];
  const liveCalories = calculateCameraSessionCalories(
    selectedExercise,
    Math.max(0.2, elapsedSeconds / 60),
    analysisResult?.totalReps ?? 0,
    userWeightKg
  );

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              100% On-Device Browser Privacy
              <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                Local WebAssembly
              </Badge>
            </h4>
            <p className="text-[11px] text-slate-300">
              Your camera stream never leaves your device. All pose keypoints are calculated in real time directly in your browser. No video is ever stored, uploaded, or transmitted.
            </p>
          </div>
        </div>
      </div>

      {/* Exercise Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(EXERCISE_CONFIGS) as ExerciseType[]).map((type) => {
          const cfg = EXERCISE_CONFIGS[type];
          const isSelected = selectedExercise === type;
          return (
            <button
              key={type}
              onClick={() => {
                if (!isCameraActive) {
                  setSelectedExercise(type);
                }
              }}
              disabled={isCameraActive}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? "border-brand-500/60 bg-brand-500/10 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-400"
              } ${isCameraActive ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                  {cfg.label}
                </span>
                <Badge variant={isSelected ? "brand" : "slate"} className="text-[10px]">
                  {cfg.targetMuscle}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {cfg.description}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/90 font-medium">
                <Activity className="h-3 w-3" />
                <span>{cfg.targetAngleDesc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Camera Viewport & Overlay Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Video Screen */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Mirror-reflected Video element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isCameraActive ? "block" : "hidden"
              }`}
            />

            {/* Canvas Overlay for Pose Landmarks */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                isCameraActive ? "block" : "hidden"
              }`}
            />

            {/* Rep Flash Effect Overlay */}
            {repFlash === "valid" && (
              <div className="absolute inset-0 bg-emerald-500/20 border-4 border-emerald-500/80 pointer-events-none animate-pulse flex items-center justify-center">
                <div className="bg-slate-950/90 border border-emerald-500/50 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-bounce" />
                  <div>
                    <div className="text-xl font-extrabold text-white">CLEAN REP!</div>
                    <div className="text-xs text-emerald-300">Perfect range of motion</div>
                  </div>
                </div>
              </div>
            )}

            {repFlash === "warning" && (
              <div className="absolute inset-0 bg-amber-500/20 border-4 border-amber-500/80 pointer-events-none animate-pulse flex items-center justify-center">
                <div className="bg-slate-950/90 border border-amber-500/50 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-2xl">
                  <AlertTriangle className="h-7 w-7 text-amber-400 animate-bounce" />
                  <div>
                    <div className="text-lg font-bold text-white">FORM WARNING</div>
                    <div className="text-xs text-amber-300">Check depth or posture</div>
                  </div>
                </div>
              </div>
            )}

            {/* Idle State / Placeholder */}
            {!isCameraActive && !isModelLoading && (
              <div className="text-center p-8 max-w-md space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400 shadow-inner">
                  <Camera className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Vision Coach Ready</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {exerciseConfig.cameraSetupTip}
                  </p>
                </div>
                <Button
                  onClick={handleStartCamera}
                  variant="primary"
                  className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-brand-500/20"
                >
                  <Play className="h-4 w-4 mr-2" /> Start Camera Coach
                </Button>
              </div>
            )}

            {/* Model Loading State */}
            {isModelLoading && (
              <div className="text-center p-8 space-y-3">
                <Loader2 className="h-10 w-10 text-brand-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">Loading MediaPipe AI Vision Pipeline...</p>
                <p className="text-xs text-slate-400">Initializing WebAssembly neural vision engine on your device</p>
              </div>
            )}

            {/* Active HUD Overlays on Video */}
            {isCameraActive && (
              <>
                {/* Top-left Movement State & Timer */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge variant="brand" className="px-2.5 py-1 text-xs font-mono font-bold uppercase">
                    {analysisResult?.phase || "Tracking"}
                  </Badge>
                  <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-xs font-mono text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {formatTime(elapsedSeconds)}
                  </div>
                </div>

                {/* Bottom Real-time Feedback Banner */}
                {analysisResult && (
                  <div className="absolute bottom-4 inset-x-4">
                    <div
                      className={`p-3 rounded-xl backdrop-blur-md border flex items-center justify-between gap-3 text-xs transition-colors ${
                        analysisResult.issues.length > 0
                          ? "bg-amber-950/80 border-amber-500/40 text-amber-200"
                          : "bg-slate-950/80 border-slate-800 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {analysisResult.issues.length > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
                        )}
                        <span className="font-semibold">{analysisResult.feedback}</span>
                      </div>
                      <Badge
                        variant={analysisResult.formScore >= 85 ? "brand" : "amber"}
                        className="text-[10px] shrink-0"
                      >
                        Quality: {analysisResult.formScore}%
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              {!isCameraActive ? (
                <Button
                  onClick={handleStartCamera}
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  disabled={isModelLoading}
                >
                  <Play className="h-4 w-4 mr-1.5" /> Start Coach
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleTogglePause}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-200"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-1.5 text-brand-400" /> Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-1.5 text-amber-400" /> Pause
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleResetSession}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
                  </Button>

                  <Button
                    onClick={handleFinishAndSave}
                    variant="primary"
                    size="sm"
                    className="font-bold bg-rose-600 hover:bg-rose-500 text-white"
                    disabled={isSavingSession}
                  >
                    {isSavingSession ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1.5" /> Finish &amp; Save
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAudioFeedback((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  audioFeedback
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
                title={audioFeedback ? "Mute audio cues" : "Unmute audio cues"}
              >
                {audioFeedback ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="hidden sm:inline">Audio Dings</span>
              </button>
            </div>
          </div>

          {/* Camera Permission / Error Callout */}
          {cameraError && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">Camera Access Error</p>
                <p className="leading-relaxed">{cameraError}</p>
                {permissionDenied && (
                  <p className="text-[11px] text-slate-300 mt-1">
                    Tip: Look for the camera icon in your browser URL address bar to grant permission, then reload or click Start again.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Rep & Analytics Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Big Rep Counter Card */}
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Repetition Counter
              </span>
              <Badge variant="brand" className="text-[11px]">
                {exerciseConfig.label}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-4">
              <div>
                <div className="text-5xl font-black text-white tracking-tight">
                  {analysisResult?.totalReps ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Total Reps Completed</div>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-400">
                  {analysisResult?.correctReps ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Clean &amp; Valid Reps</div>
              </div>
            </div>

            {/* Quality & Warnings Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-1">Form Quality</div>
                <div className="text-lg font-bold text-brand-400">
                  {analysisResult?.formScore ? `${analysisResult.formScore}%` : "—"}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="text-slate-400 mb-1">Form Warnings</div>
                <div className="text-lg font-bold text-amber-400">
                  {analysisResult?.formWarnings ?? 0}
                </div>
              </div>
            </div>

            {/* Active Calorie Burn */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Estimated Energy Burn</span>
              </div>
              <span className="font-bold text-white font-mono">~{liveCalories} kcal</span>
            </div>

            {/* Current Movement Phase Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Phase Progress</span>
                <span className="font-bold text-white capitalize">
                  {analysisResult?.phase || "Awaiting Start"}
                </span>
              </div>
              <Progress
                value={
                  analysisResult?.phase === "bottom" || analysisResult?.phase === "contracted"
                    ? 100
                    : analysisResult?.phase === "descending" || analysisResult?.phase === "curling"
                    ? 50
                    : analysisResult?.phase === "ascending" || analysisResult?.phase === "extending"
                    ? 75
                    : 15
                }
                className="h-2 bg-slate-800"
              />
            </div>
          </Card>

          {/* Form Guide & Tips */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Camera Setup Guidelines</span>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Ensure good indoor lighting facing your body, avoiding bright backlights.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{exerciseConfig.cameraSetupTip}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span>Lock out fully between reps to ensure full movement cycle credit.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Session Completed Summary Modal / Callout */}
      {sessionSummary && (
        <Card className="border-emerald-500/40 bg-slate-900/90 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Workout Session Complete!</h3>
                <p className="text-xs text-slate-300">{sessionSummary.message}</p>
              </div>
            </div>

            {sessionSummary.xpEarned > 0 && (
              <Badge variant="brand" className="text-sm px-3 py-1 font-bold">
                +{sessionSummary.xpEarned} XP Earned
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-white">{sessionSummary.totalReps}</div>
              <div className="text-xs text-slate-400 mt-1">Total Reps</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-emerald-400">{sessionSummary.correctReps}</div>
              <div className="text-xs text-slate-400 mt-1">Clean Reps</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-brand-400">{sessionSummary.averageFormScore}%</div>
              <div className="text-xs text-slate-400 mt-1">Form Quality</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl font-black text-amber-400">{sessionSummary.caloriesBurned}</div>
              <div className="text-xs text-slate-400 mt-1">Active kcal</div>
            </div>
          </div>

          {sessionSummary.unlockedAchievement && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-xs text-purple-200">
              <Award className="h-5 w-5 text-purple-400 shrink-0" />
              <span>
                <strong>Achievement Unlocked:</strong> {sessionSummary.unlockedAchievement} (+50 XP)!
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setSessionSummary(null)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300"
            >
              Dismiss Summary
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
