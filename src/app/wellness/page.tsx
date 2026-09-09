import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { WellnessInteractive } from "@/components/wellness/wellness-interactive";

export default async function MentalWellnessPage() {
  const session = await getSession();

  let todayCheckIn = null;
  let totalMeditationSessions = 0;
  let totalMeditationMinutes = 0;
  let totalMudrasPracticed = 0;
  let currentStreak = 0;
  let recentCheckIns: Array<{
    id: string;
    mood: string;
    stressLevel: number;
    energyLevel: number;
    sleepQuality: string;
    checkedInAt: string;
  }> = [];

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        wellnessCheckIns: {
          orderBy: { checkedInAt: "desc" },
          take: 10,
        },
        meditationLogs: {
          orderBy: { completedAt: "desc" },
        },
        mudraProgress: true,
        gamification: true,
      },
    });

    if (user) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const latestToday = user.wellnessCheckIns.find(
        (c) => new Date(c.checkedInAt) >= startOfToday
      );

      if (latestToday) {
        todayCheckIn = {
          id: latestToday.id,
          mood: latestToday.mood,
          stressLevel: latestToday.stressLevel,
          energyLevel: latestToday.energyLevel,
          sleepQuality: latestToday.sleepQuality,
          notes: latestToday.notes,
          checkedInAt: latestToday.checkedInAt.toISOString(),
        };
      }

      totalMeditationSessions = user.meditationLogs.length;
      totalMeditationMinutes = user.meditationLogs.reduce(
        (sum, m) => sum + m.durationMinutes,
        0
      );

      totalMudrasPracticed = user.mudraProgress.reduce(
        (sum, m) => sum + m.practiceCount,
        0
      );

      currentStreak = user.gamification?.currentStreak ?? 0;

      recentCheckIns = user.wellnessCheckIns.map((c) => ({
        id: c.id,
        mood: c.mood,
        stressLevel: c.stressLevel,
        energyLevel: c.energyLevel,
        sleepQuality: c.sleepQuality,
        checkedInAt: c.checkedInAt.toISOString(),
      }));
    }
  }

  return (
    <WellnessInteractive
      session={session}
      initialData={{
        todayCheckIn,
        totalMeditationSessions,
        totalMeditationMinutes,
        totalMudrasPracticed,
        currentStreak,
        recentCheckIns,
      }}
    />
  );
}
