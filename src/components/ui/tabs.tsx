"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ items, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onChange?.(id);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800",
        className
      )}
    >
      {items.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelect(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer",
              isActive
                ? "bg-brand-500 text-slate-950 font-semibold shadow-md shadow-brand-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
