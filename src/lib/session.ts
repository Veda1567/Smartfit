import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
  type SessionUser,
} from "@/lib/auth-constants";
import { signSessionToken, verifySessionToken } from "@/lib/jwt";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, cookieOptions());
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  try {
    jar.delete(SESSION_COOKIE_NAME);
  } catch {
    // Cookie was already cleared by maxAge: 0
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      try {
        jar.delete(SESSION_COOKIE_NAME);
      } catch {
        // Cookies can only be modified in Server Actions or Route Handlers in Next.js
      }
      return null;
    }

    return {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    // If called outside an active request context (e.g. CLI test runners, static generation), safely return null
    return null;
  }
}
