"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  Loader2,
  Dumbbell,
  Droplets,
  Brain,
  Flame,
  ChevronRight,
  Heart,
  Zap,
  CheckCircle2,
  ArrowRight,
  Plus,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  sendCoachMessageAction,
  type ChatMessageItem,
} from "@/app/actions/coach";
import { logWaterAction } from "@/app/actions/fitness";
import type { CoachUserContext, CoachBrief } from "@/lib/ai-coach";

interface CoachInteractiveProps {
  context: CoachUserContext;
  brief: CoachBrief;
  initialSessionId: string | null;
  initialMessages: ChatMessageItem[];
}

export function CoachInteractive({
  context,
  brief,
  initialSessionId,
  initialMessages,
}: CoachInteractiveProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [waterMl, setWaterMl] = useState(context.todayWaterMl);
  const [waterLoading, setWaterLoading] = useState(false);
  const [xpBanner, setXpBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const promptSuggestions = [
    "What is today's recommended workout?",
    "Suggest a high-protein post-workout snack",
    "How can I reduce stress right now?",
    "Give me advice to improve my chess tactics",
    "Review my weekly SmartFit progress",
  ];

  const handleSendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    setInputVal("");
    setLoading(true);

    // Optimistic local user message
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      sender: "user",
      content: clean,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendCoachMessageAction(sessionId, clean);
      if (res.success && res.assistantMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          res.userMessage || tempUserMsg,
          res.assistantMessage!,
        ]);
        if (res.xpEarned && res.xpEarned > 0) {
          setXpBanner(`+${res.xpEarned} XP awarded for daily coach consultation! 🔥`);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            content: res.error || "I encountered an issue processing your request. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          content: "Network communication error. Please verify your connection.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWaterLog = async () => {
    setWaterLoading(true);
    try {
      const res = await logWaterAction(250);
      if (res.success && res.totalToday !== undefined) {
        setWaterMl(res.totalToday);
      }
    } catch (err) {
      console.error("Failed to log water:", err);
    } finally {
      setWaterLoading(false);
    }
  };

  const waterPct = Math.min(
    100,
    Math.round((waterMl / Math.max(1, context.waterTargetMl)) * 100)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <SectionHeader
        category="SmartFit Intelligence"
        title="AI Wellness & Fitness Coach"
        description="Your unified personal coach synthesizing biometrics, training load, hydration, mindful reflections, and cognitive milestones."
      />

      {xpBanner && (
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-400 fill-brand-400" />
            <span className="font-bold">{xpBanner}</span>
          </div>
          <button onClick={() => setXpBanner(null)} className="text-xs underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Real-Time Personalized Coaching Brief */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coach Greeting & User Status Card */}
          <Card className="border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-cyan-500 text-slate-950 shadow-md shadow-brand-500/20">
                <Bot className="h-6 w-6 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Daily Coaching Brief</h3>
                  <Badge variant="brand" className="text-[10px]">Level {context.currentLevel}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Goal: <strong className="text-white capitalize">{context.fitnessGoal?.replace(/_/g, " ") || "Vitality"}</strong>
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Streak</span>
                <span className="font-extrabold text-amber-400 text-sm flex items-center justify-center gap-0.5">
                  <Flame className="h-3 w-3 fill-amber-400" /> {context.currentStreak}d
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Recovery</span>
                <span className="font-extrabold text-brand-400 text-xs truncate block">
                  {brief.recoveryScore.status.split(" ")[0]}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">Chess ELO</span>
                <span className="font-extrabold text-cyan-400 text-sm">{context.chessElo}</span>
              </div>
            </div>
          </Card>

          {/* Next Recommended Action CTA */}
          <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 p-5 space-y-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <Badge variant="amber" className="text-[10px]">Top Recommendation</Badge>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{brief.nextBestAction.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {brief.nextBestAction.description}
              </p>
            </div>
            <Link href={brief.nextBestAction.href} className="block">
              <Button size="sm" variant="primary" className="w-full text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5">
                <span>{brief.nextBestAction.cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>

          {/* Hydration Widget */}
          <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <Droplets className="h-4 w-4" />
                <span>Hydration Tracking</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="text-[11px] py-1 px-2.5 h-auto flex items-center gap-1"
                onClick={handleQuickWaterLog}
                disabled={waterLoading}
              >
                <Plus className="h-3 w-3" /> +250ml
              </Button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Intake: {waterMl} / {context.waterTargetMl} ml</span>
                <span className="font-bold text-white">{waterPct}%</span>
              </div>
              <Progress value={waterPct} variant="cyan" />
            </div>
            <p className="text-[11px] text-slate-400">{brief.hydrationStatus.statusText}</p>
          </Card>

          {/* Structured Guidance Cards */}
          <div className="space-y-3">
            {/* Workout */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400">
                  <Dumbbell className="h-4 w-4" /> Recommended Routine
                </div>
                <Badge variant="brand" className="text-[10px]">{brief.workoutRecommendation.duration}</Badge>
              </div>
              <div className="text-sm font-bold text-white">{brief.workoutRecommendation.title}</div>
              <p className="text-xs text-slate-400">{brief.workoutRecommendation.focus}</p>
            </div>

            {/* Mindful Wellness */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                <Heart className="h-4 w-4" /> Mindfulness &amp; Recovery
              </div>
              <div className="text-sm font-bold text-white">{brief.wellnessRecommendation.action}</div>
              <p className="text-xs text-slate-400">{brief.wellnessRecommendation.rationale}</p>
            </div>

            {/* Nutrition */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Flame className="h-4 w-4" /> Daily Nutrition Target
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {brief.nutritionAdvice.calorieTarget}
                </span>
              </div>
              <p className="text-xs text-slate-400">{brief.nutritionAdvice.practicalTip}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Coach Chat Window */}
        <div className="lg:col-span-7">
          <Card className="border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col h-[750px] max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-950/80 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 text-slate-950 shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Conversational Coach
                    <span className="flex h-2 w-2 rounded-full bg-brand-400" />
                  </h3>
                  <p className="text-xs text-slate-400">Contextual Mind &amp; Body Assistant</p>
                </div>
              </div>

              <Badge variant="slate" className="text-[10px]">Always Available</Badge>
            </div>

            {/* Non-Medical Disclaimer Strip */}
            <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>General wellness estimates only. Not clinical diagnosis or medical therapy.</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === "user"
                        ? "bg-brand-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-brand-500/20"
                        : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-slate-500 px-1 pt-1 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-2xl p-3 w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span>Coach is formulating your personalized guidance...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/60">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Suggested Prompts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {promptSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-brand-500/40 hover:text-brand-400 transition-colors cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputVal);
              }}
              className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 p-4"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask for workout guidance, nutrition ideas, or stress tips..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!inputVal.trim() || loading}
                className="px-4 py-2.5 font-bold bg-brand-400 hover:bg-brand-300 text-slate-950 flex items-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
