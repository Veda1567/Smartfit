"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSession, createSession } from "@/lib/session";
import { isAuthSecretConfigured } from "@/lib/jwt";
import {
  validateLoginInput,
  validateRegisterInput,
  type FieldErrors,
} from "@/lib/validations/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
};

const INVALID_CREDENTIALS = "Invalid email/username or password.";

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export async function registerAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthSecretConfigured()) {
    return {
      error:
        "Authentication is not configured. Set AUTH_SECRET in your environment.",
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
    const passwordHash = await hashPassword(values.password);

    await prisma.user.create({
      data: {
        username: values.username,
        email: values.email,
        passwordHash,
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
    return {
      error:
        "Authentication is not configured. Set AUTH_SECRET in your environment.",
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

  let user;
  try {
    user = await prisma.user.findFirst({
      where: looksLikeEmail(identifier)
        ? { email: identifier.toLowerCase() }
        : { username: { equals: identifier, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        passwordHash: true,
      },
    });
  } catch (error) {
    console.error("Login lookup failed:", error);
    return { error: "Unable to sign in right now. Please try again." };
  }

  if (!user) {
    return { error: INVALID_CREDENTIALS };
  }

  const passwordMatches = await verifyPassword(values.password, user.passwordHash);
  if (!passwordMatches) {
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
    return { error: "Unable to start your session. Check AUTH_SECRET and try again." };
  }

  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();
  const safeRedirect =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/profile";

  redirect(safeRedirect);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}
