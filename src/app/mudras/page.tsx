"use client";

import React from "react";
import {
  Sparkles,
  Clock,
  ShieldAlert,
  Hand,
  CheckCircle2,
  Play,
  Info,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function MudrasPage() {
  const mudras = [
    {
      name: "Gyan Mudra (Mudra of Knowledge)",
      traditionalFocus: "Concentration, mental clarity, and calming nervous energy.",
      howToPractice:
        "Touch the tip of your index finger to the tip of your thumb. Keep the remaining three fingers gently extended and relaxed.",
      duration: "15 to 30 minutes daily",
      bestTime: "Early morning during meditation or deep reading",
      tag: "Focus & Wisdom",
      badgeVariant: "brand" as const,
    },
    {
      name: "Prana Mudra (Mudra of Vitality)",
      traditionalFocus: "Awakening vital dormant energy, reducing lethargy, and enhancing alertness.",
      howToPractice:
        "Join the tips of the little finger and ring finger with the tip of the thumb. Keep the index and middle fingers straight.",
      duration: "15 to 20 minutes daily",
      bestTime: "Morning or mid-afternoon energy lull",
      tag: "Vitality",
      badgeVariant: "amber" as const,
    },
    {
      name: "Vayu Mudra (Mudra of Air)",
      traditionalFocus: "Traditional association with balancing the air element and promoting joint ease.",
      howToPractice:
        "Fold the index finger into the base of the thumb mound. Gently press the back of the index finger with your thumb.",
      duration: "10 to 15 minutes",
      bestTime: "Any quiet sitting time",
      tag: "Balance",
      badgeVariant: "cyan" as const,
    },
    {
      name: "Shunya Mudra (Mudra of Emptiness)",
      traditionalFocus: "Calming spatial disorientation and cultivating inner mental stillness.",
      howToPractice:
        "Bend your middle finger down so its tip touches the fleshy base of the thumb. Press down lightly with the thumb.",
      duration: "10 to 15 minutes",
      bestTime: "Quiet reflection or evening mindfulness",
      tag: "Stillness",
      badgeVariant: "purple" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <SectionHeader
        category="Traditional Mindfulness"
        title="Yogic Mudras Gallery"
        description="Explore traditional hand gestures from classical yogic traditions. Practice mindful hand positioning to anchor physical stillness and meditation posture."
      />

      {/* Non-Medical Traditional Practice Notice */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-400">Traditional Wellness Practice:</span>{" "}
          Mudras are traditional postural gestures intended to cultivate physical awareness and mental focus during meditation. They are not medical treatments or clinical therapies.
        </div>
      </div>

      {/* Mudras Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {mudras.map((mudra, idx) => (
          <Card
            key={idx}
            className="border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Hand className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-white">
                    {mudra.name}
                  </CardTitle>
                </div>
                <Badge variant={mudra.badgeVariant}>{mudra.tag}</Badge>
              </div>

              {/* Hand Posture Graphic Placeholder Shell */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center">
                <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <Hand className="h-10 w-10 text-amber-400/80" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    [Hand Posture Vector Illustration Placeholder]
                  </span>
                </div>
              </div>

              {/* Instructions & Guidelines */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-bold text-slate-200">How to Form:</span>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{mudra.howToPractice}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-200">Traditional Focus:</span>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{mudra.traditionalFocus}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{mudra.duration}</span>
              </div>
              <Button size="sm" variant="secondary" className="flex items-center gap-1 text-xs">
                <Play className="h-3 w-3" /> Practice Timer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
