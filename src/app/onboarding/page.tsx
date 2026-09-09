import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Fitness Onboarding & Screening | SmartFit",
  description:
    "Set up your biometrics, calculate your baseline BMI, and receive your personalized fitness and cognitive wellness roadmap.",
};

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      profile: true,
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/onboarding");
  }

  return (
    <div className="relative min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-10 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10">
        <OnboardingWizard
          initialProfile={user.profile}
          username={user.username}
        />
      </div>
    </div>
  );
}
