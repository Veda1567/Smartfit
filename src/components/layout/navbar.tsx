"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Dumbbell,
  Brain,
  Sparkles,
  Trophy,
  Menu,
  X,
  User,
  HeartPulse,
  Layers,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth-constants";

export function Navbar({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/trainer", label: "Trainer", icon: HeartPulse },
    { href: "/fitness", label: "Fitness", icon: Dumbbell },
    { href: "/wellness", label: "Wellness", icon: Sparkles },
    { href: "/meditation", label: "Meditation", icon: Layers },
    { href: "/mudras", label: "Mudras", icon: Activity },
    { href: "/chess", label: "Chess", icon: Brain },
    { href: "/cognitive", label: "Cognitive", icon: Brain },
    { href: "/challenges", label: "Challenges", icon: Trophy },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-500/20">
            <Activity className="h-6 w-6 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              Smart<span className="text-brand-400">Fit</span>
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-slate-400 sm:block">
              Mind & Body Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-300">
          {navLinks.slice(0, 7).map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-slate-900 text-brand-400 font-semibold border border-slate-800"
                    : "hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/challenges"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/challenges"
                ? "bg-slate-900 text-brand-400 font-semibold"
                : "hover:text-white hover:bg-slate-900/60"
            }`}
          >
            Challenges
          </Link>
          <Link
            href="/leaderboard"
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              pathname === "/leaderboard"
                ? "bg-slate-900 text-brand-400 font-semibold"
                : "hover:text-white hover:bg-slate-900/60"
            }`}
          >
            Rankings
          </Link>
        </nav>

        {/* Right Action & Auth / Profile Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant={pathname === "/dashboard" ? "primary" : "ghost"}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  variant={pathname === "/profile" ? "primary" : "secondary"}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant={pathname === "/login" ? "primary" : "secondary"}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button
                  variant={pathname === "/register" ? "primary" : "outline"}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register</span>
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border transition-colors ${
                    isActive
                      ? "border-brand-500/40 bg-brand-500/10 text-brand-400 font-bold"
                      : "border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 text-brand-400 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="pt-3 flex flex-col gap-2 border-t border-slate-800">
            {session ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                  <span>Signed in as <strong className="text-white">{session.username}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-medium border border-slate-800 bg-slate-900/80 text-slate-300"
                  >
                    <Activity className="h-4 w-4 text-brand-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-medium border border-slate-800 bg-slate-900/80 text-slate-300"
                  >
                    <User className="h-4 w-4 text-brand-400" />
                    Profile
                  </Link>
                </div>
                <form action={logoutAction} className="w-full">
                  <Button type="submit" variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-medium border border-slate-800 bg-slate-900/80 text-slate-300"
                >
                  <LogIn className="h-4 w-4 text-brand-400" />
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-medium border border-brand-500/40 bg-brand-500/10 text-brand-400"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Product: SmartFit Platform</span>
              <Badge variant="brand" className="text-[10px]">
                Phase 4 Design Shell
              </Badge>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
