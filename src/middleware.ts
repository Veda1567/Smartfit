import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { verifySessionToken } from "@/lib/jwt";
import { sanitizeCallbackUrl } from "@/lib/validations/auth";

const PROTECTED_PREFIXES = ["/profile", "/dashboard", "/onboarding"];
const AUTH_PAGES = ["/login", "/register"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page);
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. Unauthenticated access to protected user-specific pages
  if (isProtectedPath(pathname) && !session) {
    const fullPath = pathname + (search || "");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", fullPath);
    const response = NextResponse.redirect(loginUrl);

    // If token exists but failed verification (e.g. expired or tampered), delete stale cookie
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // 2. Authenticated access to auth pages (/login, /register)
  if (isAuthPage(pathname) && session) {
    const callbackParam = request.nextUrl.searchParams.get("callbackUrl");
    const destination = sanitizeCallbackUrl(callbackParam, "/dashboard");
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};

