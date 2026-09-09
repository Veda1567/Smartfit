import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
