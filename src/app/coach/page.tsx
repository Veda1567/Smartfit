import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getCoachOverviewAction } from "@/app/actions/coach";
import { CoachInteractive } from "@/components/coach/coach-interactive";

export default async function CoachPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/coach");
  }

  const { context, brief, sessionId, messages } = await getCoachOverviewAction();

  if (!context || !brief) {
    redirect("/onboarding");
  }

  return (
    <CoachInteractive
      context={context}
      brief={brief}
      initialSessionId={sessionId}
      initialMessages={messages}
    />
  );
}
