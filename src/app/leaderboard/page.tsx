import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getLeaderboardAction } from "@/app/actions/gamification";
import { LeaderboardInteractive } from "@/components/leaderboard/leaderboard-interactive";

export default async function LeaderboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/leaderboard");
  }

  const { topThree, rankings, currentUserRank } = await getLeaderboardAction("overall");

  return (
    <LeaderboardInteractive
      initialTopThree={topThree}
      initialRankings={rankings}
      initialCurrentUserRank={currentUserRank}
      currentUsername={session.username}
    />
  );
}
