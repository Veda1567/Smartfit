import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { TrainerInteractive } from "@/components/trainer/trainer-interactive";

export default async function TrainerPage() {
  const session = await getSession();

  let profile = null;
  let totalWorkouts = 0;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        profile: true,
        workoutSessions: true,
      },
    });

    if (user) {
      profile = user.profile;
      totalWorkouts = user.workoutSessions.length;
    }
  }

  return (
    <TrainerInteractive
      initialProfile={profile}
      session={session}
      totalWorkoutsLogged={totalWorkouts}
    />
  );
}
