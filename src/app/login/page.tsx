import React from "react";
import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | SmartFit",
  description: "Sign in to your SmartFit account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl?.startsWith("/") && !params.callbackUrl.startsWith("//")
      ? params.callbackUrl
      : "/profile";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md shadow-brand-500/20">
            <Activity className="h-6 w-6 text-slate-950" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access your SmartFit profile and personal data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            registered={params.registered === "1"}
            callbackUrl={callbackUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
