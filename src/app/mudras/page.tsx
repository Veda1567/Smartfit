import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { MudrasInteractive } from "@/components/mudras/mudras-interactive";

export default async function MudrasPage() {
  const session = await getSession();

  const userMudraStats: Record<string, { practiceCount: number; totalMinutes: number }> = {};

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        mudraProgress: true,
      },
    });

    if (user) {
      user.mudraProgress.forEach((item) => {
        userMudraStats[item.mudraKey] = {
          practiceCount: item.practiceCount,
          totalMinutes: item.totalMinutes,
        };
      });
    }
  }

  return (
    <MudrasInteractive
      session={session}
      initialData={{
        userMudraStats,
      }}
    />
  );
}
