import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "brand" | "slate" | "amber" | "rose" | "cyan" | "purple";
}

export function Badge({
  className,
  variant = "brand",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    brand: "bg-brand-500/10 text-brand-400 border-brand-500/30",
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
