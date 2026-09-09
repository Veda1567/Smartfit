import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getChallengesAction } from "@/app/actions/gamification";
import { getEffectiveStreak } from "@/lib/gamification";
import { ChallengesInteractive } from "@/components/challenges/challenges-interactive";

export default async function ChallengesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/challenges");
  }

  const { challenges } = await getChallengesAction();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { gamification: true },
  });

  const streakInfo = getEffectiveStreak(user?.gamification ?? null);

  return (
    <ChallengesInteractive
      initialChallenges={challenges}
      currentStreak={streakInfo.currentStreak}
    />
  );
}
