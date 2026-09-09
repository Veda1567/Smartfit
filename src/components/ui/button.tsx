import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
      primary:
        "bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold shadow-lg shadow-brand-500/25 focus:ring-brand-400 focus:ring-offset-slate-950 active:scale-[0.98]",
      secondary:
        "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 focus:ring-slate-500 focus:ring-offset-slate-950 active:scale-[0.98]",
      outline:
        "border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 focus:ring-brand-500 focus:ring-offset-slate-950",
      ghost:
        "text-slate-300 hover:text-white hover:bg-slate-800/60 focus:ring-slate-600",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 focus:ring-rose-500",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5 font-semibold",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
