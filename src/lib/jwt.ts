import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { SessionPayload } from "@/lib/auth-constants";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth-constants";

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export function isAuthSecretConfigured(): boolean {
  return getJwtSecret() !== null;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is missing or too short. Set it in .env.local.");
  }

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .setSubject(payload.userId)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = typeof payload.userId === "string" ? payload.userId : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const username = typeof payload.username === "string" ? payload.username : null;
    const role = typeof payload.role === "string" ? payload.role : "user";

    if (!userId || !email || !username) {
      return null;
    }

    return { userId, email, username, role };
  } catch {
    return null;
  }
}
