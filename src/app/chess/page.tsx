import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChessInteractive } from "@/components/chess/chess-interactive";

export default async function ChessPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/chess");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { chessStats: true },
  });

  const stats = {
    eloRating: user?.chessStats?.eloRating ?? 1200,
    gamesPlayed: user?.chessStats?.gamesPlayed ?? 0,
    wins: user?.chessStats?.wins ?? 0,
    losses: user?.chessStats?.losses ?? 0,
    draws: user?.chessStats?.draws ?? 0,
    puzzleRating: user?.chessStats?.puzzleRating ?? 1200,
    puzzlesSolved: user?.chessStats?.puzzlesSolved ?? 0,
  };

  return (
    <ChessInteractive stats={stats} username={session.username} />
  );
}
