"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Mail, User, Loader2 } from "lucide-react";
import { registerAction, type AuthActionState } from "@/app/actions/auth";
import { clientValidateRegister } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const errors = clientValidateRegister({
      username: String(formData.get("username") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  }

  const fieldError = (name: string) =>
    clientErrors[name] ?? state.fieldErrors?.[name];

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          aria-invalid={Boolean(fieldError("username"))}
          aria-describedby={fieldError("username") ? "username-error" : undefined}
          icon={<User className="h-4 w-4" />}
          placeholder="e.g. smartfit_athlete"
        />
        {fieldError("username") && (
          <p id="username-error" className="mt-1.5 text-xs text-rose-400">
            {fieldError("username")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldError("email"))}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@email.com"
        />
        {fieldError("email") && (
          <p id="email-error" className="mt-1.5 text-xs text-rose-400">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(fieldError("password"))}
          aria-describedby={fieldError("password") ? "password-error" : undefined}
          icon={<Lock className="h-4 w-4" />}
          placeholder="At least 8 characters"
        />
        {fieldError("password") && (
          <p id="password-error" className="mt-1.5 text-xs text-rose-400">
            {fieldError("password")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldError("confirmPassword"))}
          aria-describedby={
            fieldError("confirmPassword") ? "confirm-password-error" : undefined
          }
          icon={<Lock className="h-4 w-4" />}
          placeholder="Re-enter your password"
        />
        {fieldError("confirmPassword") && (
          <p id="confirm-password-error" className="mt-1.5 text-xs text-rose-400">
            {fieldError("confirmPassword")}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-400 hover:text-brand-300"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
