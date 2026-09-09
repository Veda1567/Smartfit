import React from "react";
import Link from "next/link";
import { Activity, ShieldAlert, Heart, Dumbbell, Brain, Sparkles, Trophy } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 pt-12 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Smart<span className="text-brand-400">Fit</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              SmartFit is a modern platform harmonizing Physical Fitness, Mental Wellness, Meditation, Yogic Mudras, Chess & Cognitive Fitness, and Unified Gamification.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <span>Crafted for mindful strength & sharp minds.</span>
            </div>
          </div>

          {/* Nav Col 1: Physical */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Physical Training
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/trainer" className="hover:text-brand-400 transition-colors">Personal Trainer</Link></li>
              <li><Link href="/fitness" className="hover:text-brand-400 transition-colors">Fitness Dashboard</Link></li>
              <li><Link href="/trainer#bmi" className="hover:text-brand-400 transition-colors">BMI & Metrics</Link></li>
              <li><Link href="/fitness#timer" className="hover:text-brand-400 transition-colors">Interval Stopwatch</Link></li>
            </ul>
          </div>

          {/* Nav Col 2: Mental */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Mental Wellness
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/wellness" className="hover:text-cyan-400 transition-colors">Wellness Hub</Link></li>
              <li><Link href="/meditation" className="hover:text-cyan-400 transition-colors">Meditation Timers</Link></li>
              <li><Link href="/mudras" className="hover:text-cyan-400 transition-colors">Yogic Mudras</Link></li>
              <li><Link href="/wellness#breathing" className="hover:text-cyan-400 transition-colors">Box Breathing</Link></li>
            </ul>
          </div>

          {/* Nav Col 3: Mind & Play */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Cognitive & Play
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/chess" className="hover:text-amber-400 transition-colors">Chess vs AI</Link></li>
              <li><Link href="/cognitive" className="hover:text-amber-400 transition-colors">Brain Games</Link></li>
              <li><Link href="/challenges" className="hover:text-amber-400 transition-colors">Daily Quests</Link></li>
              <li><Link href="/leaderboard" className="hover:text-amber-400 transition-colors">Leaderboard</Link></li>
            </ul>
          </div>
        </div>

        {/* Responsible Non-Medical Wellness Disclaimer Notice */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-start gap-3 shadow-inner">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-200">Responsible Health & Wellness Notice:</span>
            <p className="leading-relaxed">
              SmartFit provides general wellness estimations, educational exercises, and traditional mindfulness practices.
              BMI numbers, calorie calculations, and nutritional insights are general screening metrics and estimates—not medical diagnoses, clinical prescriptions, or universal mandates.
              SmartFit does not diagnose medical conditions or prescribe pharmaceuticals. Always consult a qualified healthcare provider before undertaking any new workout or dietary regimen.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} SmartFit Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern web standards • Phase 4 Design Shell
          </p>
        </div>
      </div>
    </footer>
  );
}
