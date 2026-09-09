"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { Lock, Mail, Loader2 } from "lucide-react";
import { loginAction, type AuthActionState } from "@/app/actions/auth";
import { clientValidateLogin } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = {};

export function LoginForm({
  registered = false,
  loggedOut = false,
  callbackUrl = "/dashboard",
}: {
  registered?: boolean;
  loggedOut?: boolean;
  callbackUrl?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const errors = clientValidateLogin({
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  }

  const identifierError = clientErrors.identifier ?? state.fieldErrors?.identifier;
  const passwordError = clientErrors.password ?? state.fieldErrors?.password;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {registered && !state.error && (
        <div
          role="status"
          className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-300"
        >
          Account created! Sign in with your new credentials.
        </div>
      )}

      {loggedOut && !registered && !state.error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          You have been signed out successfully.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {state.error}
        </div>
      )}

      <div>
        <Label htmlFor="identifier">Email or username</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          aria-invalid={Boolean(identifierError)}
          aria-describedby={identifierError ? "identifier-error" : undefined}
          icon={<Mail className="h-4 w-4" />}
          placeholder="you@email.com or username"
        />
        {identifierError && (
          <p id="identifier-error" className="mt-1.5 text-xs text-rose-400">
            {identifierError}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "login-password-error" : undefined}
          icon={<Lock className="h-4 w-4" />}
          placeholder="Enter your password"
        />
        {passwordError && (
          <p id="login-password-error" className="mt-1.5 text-xs text-rose-400">
            {passwordError}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-sm text-slate-400">
        New to SmartFit?{" "}
        <Link
          href={
            callbackUrl && callbackUrl !== "/dashboard"
              ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/register"
          }
          className="font-semibold text-brand-400 hover:text-brand-300"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
