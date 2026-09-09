import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { MeditationInteractive } from "@/components/meditation/meditation-interactive";

export default async function MeditationPage() {
  const session = await getSession();

  let totalSessions = 0;
  let totalMinutes = 0;
  let recentSessions: Array<{
    id: string;
    sessionType: string;
    durationMinutes: number;
    soundscape: string | null;
    notes: string | null;
    completedAt: string;
  }> = [];

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        meditationLogs: {
          orderBy: { completedAt: "desc" },
          take: 10,
        },
      },
    });

    if (user) {
      totalSessions = user.meditationLogs.length;
      totalMinutes = user.meditationLogs.reduce(
        (sum, m) => sum + m.durationMinutes,
        0
      );
      recentSessions = user.meditationLogs.map((m) => ({
        id: m.id,
        sessionType: m.sessionType,
        durationMinutes: m.durationMinutes,
        soundscape: m.soundscape,
        notes: m.notes,
        completedAt: m.completedAt.toISOString(),
      }));
    }
  }

  return (
    <MeditationInteractive
      session={session}
      initialData={{
        totalSessions,
        totalMinutes,
        recentSessions,
      }}
    />
  );
}
