import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AchievementCardProps {
  title: string;
  description: string;
  category: "physical" | "mental" | "chess" | "consistency";
  xpReward: number;
  isUnlocked: boolean;
  unlockedDate?: string;
  icon: React.ReactNode;
  className?: string;
}

export function AchievementCard({
  title,
  description,
  category,
  xpReward,
  isUnlocked,
  unlockedDate,
  icon,
  className,
}: AchievementCardProps) {
  return (
    <Card
      className={cn(
        "relative flex items-start gap-4 p-4 border-slate-800 bg-slate-900/60 transition-all duration-200",
        isUnlocked
          ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
          : "opacity-75 grayscale hover:grayscale-0 hover:opacity-100",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl",
          isUnlocked
            ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/10"
            : "border-slate-800 bg-slate-800/80 text-slate-500"
        )}
      >
        {icon}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            {title}
            {isUnlocked ? (
              <CheckCircle2 className="h-4 w-4 text-brand-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-slate-500" />
            )}
          </h4>
          <Badge variant="amber" className="text-[10px] py-0 px-2">
            +{xpReward} XP
          </Badge>
        </div>
        <p className="text-xs text-slate-400 leading-snug">{description}</p>
        {unlockedDate && (
          <p className="text-[10px] text-brand-400/90 pt-1 font-medium">
            Unlocked on {unlockedDate}
          </p>
        )}
      </div>
    </Card>
  );
}
