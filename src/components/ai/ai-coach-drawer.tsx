"use client";

import React, { useState } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Loader2,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export function AICoachDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Realistic sample messages for visual shell demonstration
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "assistant",
      text: "Hello! I am your SmartFit AI Wellness Coach. I can provide general workout routine suggestions, mindful eating tips, or chess tactical ideas. How can I support your fitness and mental wellness journey today?",
      timestamp: "Just now",
    },
  ]);

  const promptSuggestions = [
    "Suggest a 20-min beginner core workout",
    "Healthy pre-workout snack suggestions",
    "How does box breathing reduce stress?",
    "Tips for chess opening principles",
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputVal,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsLoading(true);

    // Visual shell simulation only (NO real API call)
    setTimeout(() => {
      const mockReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "This is a simulated preview of the SmartFit AI Wellness Coach. In Phase 17, this assistant will be integrated with Google Gemini to generate dynamic, personalized wellness guidance based on your profile and metrics!",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, mockReply]);
      setIsLoading(false);
    }, 1200);
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputVal(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-500 to-cyan-500 p-3.5 sm:px-5 sm:py-3.5 text-slate-950 font-bold shadow-2xl shadow-brand-500/30 transition-all duration-300 hover:scale-105 hover:shadow-brand-500/50 cursor-pointer"
          aria-label="Open SmartFit AI Wellness Coach"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>
          </div>
          <span className="hidden sm:inline text-sm font-bold">AI Wellness Coach</span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/60 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-cyan-500 text-slate-950">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  SmartFit AI Coach
                  <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                    Preview Shell
                  </Badge>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Mind & Body Guidance
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Health Disclaimer Strip */}
          <div className="bg-slate-900/50 border-b border-slate-800/80 px-3.5 py-1.5 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>General wellness estimates only. Not medical or clinical advice.</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-brand-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-brand-500/20"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 px-1 pt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Loading State Skeleton */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl p-3 w-fit">
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                <span>AI Coach is thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/40">
            <p className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Suggested Queries
            </p>
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-brand-500/40 hover:text-brand-400 transition-colors cursor-pointer text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-800 bg-slate-950 p-3"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask your AI Wellness Coach..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={!inputVal.trim() || isLoading}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
