import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badgeText?: string;
  badgeVariant?: "brand" | "slate" | "amber" | "rose" | "cyan";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeText,
  badgeVariant = "brand",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700/80 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 pt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/80 text-brand-400 border border-slate-700/60 shadow-inner">
            {icon}
          </div>
          {badgeText && (
            <Badge variant={badgeVariant} className="text-[10px] py-0.5 px-2">
              {badgeText}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
