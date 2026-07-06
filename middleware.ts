import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { recordStartupRequest } from "@/lib/startupDiagnostics";

const adminOnlyPaths = ["/admin", "/api/admin"];

function isLoopbackAliasHost(hostname: string): boolean {
  const value = String(hostname || "").toLowerCase();
  return value === "127.0.0.1" || value === "::1" || value === "[::1]";
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function getAdminAllowlist(): Set<string> {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean)
  );
}

function isPathMatch(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function shouldSkipAuthInDev(req: NextRequest, pathname: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (req.method !== "GET") return false;

  if (pathname === "/api/questions" || pathname.startsWith("/api/questions/")) {
    return true;
  }

  if (/^\/api\/contests\/[^/]+\/chat$/.test(pathname)) {
    return true;
  }

  return false;
}

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (pathname.startsWith("/voice-interviewer") || pathname.startsWith("/api/voice-interview") || pathname.startsWith("/api/voice-interviewer")) {
    response.headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  } else {
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

function finalizeResponse(response: NextResponse, pathname: string, startedAt: number): NextResponse {
  const secured = withSecurityHeaders(response, pathname);

  if (process.env.NODE_ENV !== "production") {
    const durationMs = Math.max(0, Date.now() - startedAt);
    const diagnostics = recordStartupRequest(pathname, durationMs);
    secured.headers.set("X-Middleware-Time-Ms", String(durationMs));
    secured.headers.set("X-App-Uptime-Ms", String(Math.max(0, Date.now() - diagnostics.bootAt)));
  }

  return secured;
}

export async function middleware(req: NextRequest) {
  const startedAt = Date.now();
  const pathname = req.nextUrl.pathname;

  if (process.env.NODE_ENV !== "production" && isLoopbackAliasHost(req.nextUrl.hostname)) {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.hostname = "localhost";
    return finalizeResponse(NextResponse.redirect(canonicalUrl, 307), pathname, startedAt);
  }

  const isPublicRoute = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/health");
  const isAdminOnly = isPathMatch(pathname, adminOnlyPaths);
  const isApiRoute = pathname.startsWith("/api/");

  if (isPublicRoute) {
    return finalizeResponse(NextResponse.next(), pathname, startedAt);
  }

  if (req.method === "OPTIONS") {
    return finalizeResponse(NextResponse.next(), pathname, startedAt);
  }

  if (shouldSkipAuthInDev(req, pathname)) {
    return finalizeResponse(NextResponse.next(), pathname, startedAt);
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isApiRoute) {
      return finalizeResponse(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), pathname, startedAt);
    }

    const signInUrl = new URL("/auth/signin", req.url);
    const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search || ""}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return finalizeResponse(NextResponse.redirect(signInUrl), pathname, startedAt);
  }

  if (isAdminOnly) {
    const allowlist = getAdminAllowlist();
    const requesterEmail = normalizeEmail((token as { email?: string }).email);
    const isAllowedAdmin = allowlist.size > 0 && requesterEmail && allowlist.has(requesterEmail);

    if (!isAllowedAdmin) {
      if (isApiRoute) {
        return finalizeResponse(NextResponse.json({ error: "Forbidden" }, { status: 403 }), pathname, startedAt);
      }

      const fallback = new URL("/dashboard", req.url);
      return finalizeResponse(NextResponse.redirect(fallback), pathname, startedAt);
    }
  }

  return finalizeResponse(NextResponse.next(), pathname, startedAt);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-resume/:path*",
    "/resume-analyzer/:path*",
    "/resume-builder/:path*",
    "/placement-hub/:path*",
    "/coding/:path*",
    "/question/:path*",
    "/contests/:path*",
    "/chatbot/:path*",
    "/editor/:path*",
    "/voice-interviewer/:path*",
    "/admin/:path*",
    "/api/execute",
    "/api/contests/:path*",
    "/api/chatbot",
    "/api/dashboard/stats",
    "/api/admin/:path*",
    "/api/resume-analysis",
    "/api/resume-builder",
    "/api/questions/sync",
    "/api/users/sync",
    "/api/voice-interview",
  ],
};
