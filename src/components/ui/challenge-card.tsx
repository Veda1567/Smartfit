import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChallengeCardProps {
  title: string;
  category: string;
  description: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  unit?: string;
  timeLeft?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ChallengeCard({
  title,
  category,
  description,
  difficulty = "Beginner",
  xpReward,
  currentProgress,
  targetProgress,
  unit = "",
  timeLeft,
  icon,
  className,
}: ChallengeCardProps) {
  const isComplete = currentProgress >= targetProgress;

  return (
    <Card
      className={cn(
        "flex flex-col justify-between border-slate-800 bg-slate-900/80 p-5 hover:border-slate-700 transition-all duration-200",
        isComplete && "border-brand-500/40 bg-brand-500/5",
        className
      )}
    >
      <CardHeader className="p-0 pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-brand-400 border border-slate-700/60">
                {icon}
              </div>
            )}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {category}
              </span>
              <CardTitle className="text-base font-bold text-white leading-snug">
                {title}
              </CardTitle>
            </div>
          </div>
          <Badge variant="amber" className="shrink-0 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            <span>+{xpReward} XP</span>
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-400 line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-3 border-t border-slate-800/80 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Goal Progress</span>
            <span className="font-semibold text-slate-200">
              {currentProgress} / {targetProgress} {unit}
            </span>
          </div>
          <Progress
            value={currentProgress}
            max={targetProgress}
            variant={isComplete ? "brand" : "cyan"}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {timeLeft && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{timeLeft}</span>
            </div>
          )}
          <Button
            size="sm"
            variant={isComplete ? "secondary" : "primary"}
            className="ml-auto text-xs py-1.5 px-3"
          >
            {isComplete ? "Completed" : "Start Quest"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
