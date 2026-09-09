import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: "brand" | "cyan" | "amber" | "purple" | "rose";
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = "brand",
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    brand: "bg-brand-500 shadow-sm shadow-brand-500/50",
    cyan: "bg-cyan-400 shadow-sm shadow-cyan-400/50",
    amber: "bg-amber-400 shadow-sm shadow-amber-400/50",
    purple: "bg-purple-500 shadow-sm shadow-purple-500/50",
    rose: "bg-rose-500 shadow-sm shadow-rose-500/50",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>Progress</span>
          <span className="text-slate-200">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
