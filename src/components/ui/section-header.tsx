import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  category?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  category,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8",
        align === "center" && "text-center md:text-center md:items-center",
        className
      )}
    >
      <div className={cn("space-y-1.5", align === "center" && "mx-auto max-w-2xl")}>
        {category && (
          <Badge variant="brand" className="mb-2 uppercase text-[10px] tracking-wider">
            {category}
          </Badge>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
