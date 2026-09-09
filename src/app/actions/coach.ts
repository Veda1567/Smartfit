"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  getCoachUserContext,
  generateCoachBrief,
  generateSmartCoachResponse,
  type CoachUserContext,
  type CoachBrief,
} from "@/lib/ai-coach";
import { awardUserXP } from "@/lib/gamification";

export interface ChatMessageItem {
  id: string;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
}

/**
 * Retrieves the full personalized coaching brief, user context, and chat history.
 */
export async function getCoachOverviewAction(): Promise<{
  success: boolean;
  context: CoachUserContext | null;
  brief: CoachBrief | null;
  sessionId: string | null;
  messages: ChatMessageItem[];
  error?: string;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      context: null,
      brief: null,
      sessionId: null,
      messages: [],
      error: "Authentication required to access the AI Coach.",
    };
  }

  try {
    const context = await getCoachUserContext(session.id);
    if (!context) {
      return {
        success: false,
        context: null,
        brief: null,
        sessionId: null,
        messages: [],
        error: "Failed to compile user profile context.",
      };
    }

    const brief = generateCoachBrief(context);

    // Fetch or initialize active chat session
    let chatSession = await prisma.aIChatSession.findFirst({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 30,
        },
      },
    });

    if (!chatSession) {
      chatSession = await prisma.aIChatSession.create({
        data: {
          userId: session.id,
          title: "SmartFit Wellness Guidance",
          messages: {
            create: {
              sender: "assistant",
              content: `Hello ${session.username}! I am your SmartFit AI Wellness Coach. I synthesize your biometrics, daily workouts, hydration, and mindfulness logs to provide practical guidance. How can I assist you today?`,
            },
          },
        },
        include: {
          messages: true,
        },
      });
    }

    const messages: ChatMessageItem[] = chatSession.messages.map((m) => ({
      id: m.id,
      sender: m.sender as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      success: true,
      context,
      brief,
      sessionId: chatSession.id,
      messages,
    };
  } catch (error) {
    console.error("Failed to load coach overview:", error);
    return {
      success: false,
      context: null,
      brief: null,
      sessionId: null,
      messages: [],
      error: "An unexpected error occurred while contacting your AI Coach.",
    };
  }
}

/**
 * Sends a message to the AI coach, saves conversation history, and returns an intelligent response.
 */
export async function sendCoachMessageAction(
  sessionId: string | null,
  messageText: string
): Promise<{
  success: boolean;
  userMessage?: ChatMessageItem;
  assistantMessage?: ChatMessageItem;
  error?: string;
  xpEarned?: number;
}> {
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      error: "You must be signed in to converse with the AI Coach.",
    };
  }

  const cleanText = (messageText || "").trim().slice(0, 1000);
  if (cleanText.length < 1) {
    return {
      success: false,
      error: "Message cannot be empty.",
    };
  }

  try {
    // 1. Resolve or create chat session
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      const activeSession = await prisma.aIChatSession.create({
        data: {
          userId: session.id,
          title: cleanText.slice(0, 40),
        },
      });
      targetSessionId = activeSession.id;
    } else {
      // Validate ownership
      const existing = await prisma.aIChatSession.findFirst({
        where: { id: targetSessionId, userId: session.id },
      });
      if (!existing) {
        return {
          success: false,
          error: "Unauthorized chat session access.",
        };
      }
    }

    // 2. Persist User Message
    const userMsg = await prisma.aIChatMessage.create({
      data: {
        sessionId: targetSessionId,
        sender: "user",
        content: cleanText,
      },
    });

    // 3. Compile context & generate AI response
    const context = await getCoachUserContext(session.id);
    const replyText = context
      ? await generateSmartCoachResponse(context, cleanText)
      : "Hello! Please ensure your fitness profile is complete so I can tailor guidance specifically for you.";

    // 4. Persist Assistant Message
    const assistantMsg = await prisma.aIChatMessage.create({
      data: {
        sessionId: targetSessionId,
        sender: "assistant",
        content: replyText,
      },
    });

    // 5. Update session timestamp
    await prisma.aIChatSession.update({
      where: { id: targetSessionId },
      data: { updatedAt: new Date() },
    });

    // 6. Award +15 XP on first coaching interaction of the day
    let xpEarned = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const alreadyInteractedToday = await prisma.activityLog.findFirst({
      where: {
        userId: session.id,
        activityType: "ai_coach",
        createdAt: { gte: startOfToday },
      },
    });

    if (!alreadyInteractedToday) {
      await awardUserXP(
        session.id,
        15,
        "ai_coach",
        "Engaged with SmartFit AI Wellness Coach"
      );
      xpEarned = 15;
    }

    revalidatePath("/coach");
    revalidatePath("/dashboard");

    return {
      success: true,
      userMessage: {
        id: userMsg.id,
        sender: "user",
        content: userMsg.content,
        createdAt: userMsg.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMsg.id,
        sender: "assistant",
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
      xpEarned,
    };
  } catch (error) {
    console.error("Failed to send message to AI coach:", error);
    return {
      success: false,
      error: "Failed to communicate with AI Coach.",
    };
  }
}
