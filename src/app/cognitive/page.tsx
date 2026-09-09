import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CognitiveInteractive } from "@/components/cognitive/cognitive-interactive";

export default async function CognitiveGamesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/cognitive");
  }

  // Fetch personal best scores for each game
  const [memoryBest, stroopBest, mathBest] = await Promise.all([
    prisma.brainGameAttempt.findFirst({
      where: { userId: session.id, gameType: "memory_matrix" },
      orderBy: { score: "desc" },
    }),
    prisma.brainGameAttempt.findFirst({
      where: { userId: session.id, gameType: "stroop_test" },
      orderBy: { score: "desc" },
    }),
    prisma.brainGameAttempt.findFirst({
      where: { userId: session.id, gameType: "speed_math" },
      orderBy: { score: "desc" },
    }),
  ]);

  const highScores = {
    memory_matrix: memoryBest?.score ?? 0,
    stroop_test: stroopBest?.score ?? 0,
    speed_math: mathBest?.score ?? 0,
  };

  return <CognitiveInteractive highScores={highScores} />;
}
