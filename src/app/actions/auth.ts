"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSession, createSession } from "@/lib/session";
import { isAuthSecretConfigured } from "@/lib/jwt";
import {
  validateLoginInput,
  validateRegisterInput,
  sanitizeCallbackUrl,
  type FieldErrors,
} from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
};

const INVALID_CREDENTIALS = "Invalid email/username or password.";
// Constant dummy bcrypt hash for timing attack mitigation when user is not found
const DUMMY_HASH = "$2a$12$e80y7F1u0s7iF1kZ4x8aOuK3p12oR10B7m2o4r0h9q1w3e5r7t9y2";

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export async function registerAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthSecretConfigured()) {
    console.error("registerAction: AUTH_SECRET is not configured.");
    return {
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  const { values, errors } = validateRegisterInput({
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    // Proactive check for existing email or username (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: values.email, mode: "insensitive" } },
          { username: { equals: values.username, mode: "insensitive" } },
        ],
      },
      select: { email: true, username: true },
    });

    if (existingUser) {
      const fieldErrors: FieldErrors = {};
      if (existingUser.email.toLowerCase() === values.email.toLowerCase()) {
        fieldErrors.email = "An account with this email already exists.";
      }
      if (existingUser.username.toLowerCase() === values.username.toLowerCase()) {
        fieldErrors.username = "This username is already taken.";
      }
      return { fieldErrors };
    }

    const passwordHash = await hashPassword(values.password);

    await prisma.user.create({
      data: {
        username: values.username,
        email: values.email,
        passwordHash,
        gamification: {
          create: {
            totalXP: 0,
            currentLevel: 1,
            currentStreak: 0,
            longestStreak: 0,
            weeklyXP: 0,
          },
        },
        waterPreference: {
          create: {
            dailyTargetMl: 2500,
            reminderIntervalMinutes: 60,
            enableAudio: true,
          },
        },
        chessStats: {
          create: {
            eloRating: 1200,
            puzzleRating: 1200,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            puzzlesSolved: 0,
          },
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(" ")
        : String(error.meta?.target ?? "");

      const fieldErrors: FieldErrors = {};
      if (target.includes("email")) {
        fieldErrors.email = "An account with this email already exists.";
      }
      if (target.includes("username")) {
        fieldErrors.username = "This username is already taken.";
      }
      if (Object.keys(fieldErrors).length === 0) {
        fieldErrors.email = "An account with this email or username already exists.";
      }
      return { fieldErrors };
    }

    console.error("Registration failed:", error);
    return { error: "Unable to create your account. Please try again." };
  }

  redirect("/login?registered=1");
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthSecretConfigured()) {
    console.error("loginAction: AUTH_SECRET is not configured.");
    return {
      error: "Authentication service is temporarily unavailable. Please try again later.",
    };
  }

  const { values, errors } = validateLoginInput({
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  const identifier = values.identifier;

  let user = null;
  try {
    user = await prisma.user.findFirst({
      where: looksLikeEmail(identifier)
        ? { email: { equals: identifier.toLowerCase(), mode: "insensitive" } }
        : { username: { equals: identifier, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true,
        profile: {
          select: {
            heightCm: true,
            weightKg: true,
            fitnessGoal: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Login lookup failed:", error);
    return { error: "Unable to sign in right now. Please try again." };
  }

  // Always run password verification to prevent timing attack enumeration
  const passwordMatches = user
    ? await verifyPassword(values.password, user.passwordHash)
    : await verifyPassword(values.password, DUMMY_HASH);

  if (!user || !passwordMatches) {
    return { error: INVALID_CREDENTIALS };
  }

  try {
    await createSession({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    return { error: "Unable to start your session. Please try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  const rawCallback = String(formData.get("callbackUrl") ?? "").trim();
  const hasCompletedProfile = Boolean(
    user.profile?.heightCm && user.profile?.weightKg && user.profile?.fitnessGoal
  );
  const defaultDestination = hasCompletedProfile ? "/dashboard" : "/onboarding";
  const safeRedirect = sanitizeCallbackUrl(rawCallback, defaultDestination);

  redirect(safeRedirect);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/login?loggedOut=1");
}

