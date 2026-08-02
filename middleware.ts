import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { recordStartupRequest } from "@/lib/startupDiagnostics";

const adminOnlyPaths = ["/admin", "/api/admin", "/cms/admin"];

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function getAdminAllowlist(): Set<string> {
  const primaryAdmin = "satyanarayanag904@gmail.com";
  const rawAllowlist = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");

  const allowlist = String(rawAllowlist || "")
    .split(/[\n,;]+/)
    .map((email) => normalizeEmail(email))
    .filter(Boolean);

  allowlist.push(normalizeEmail(primaryAdmin));
  return new Set(allowlist);
}

function isPathMatch(pathname: string, paths: string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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

  // 1. Allow static files, assets, and Next.js internal requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Allow public routes (Landing page, sign-in/sign-up pages, NextAuth endpoints, health checks)
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health");

  if (isPublicRoute) {
    return finalizeResponse(NextResponse.next(), pathname, startedAt);
  }

  if (req.method === "OPTIONS") {
    return finalizeResponse(NextResponse.next(), pathname, startedAt);
  }

  // 3. Check for valid user authentication session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApiRoute = pathname.startsWith("/api/");

  // 4. Require authentication for all protected application and API routes
  if (!token) {
    if (isApiRoute) {
      return finalizeResponse(
        NextResponse.json({ error: "Unauthorized. Please sign in to access NextHire platform." }, { status: 401 }),
        pathname,
        startedAt
      );
    }

    const signInUrl = new URL("/auth/signin", req.url);
    const callbackUrl = `${req.nextUrl.pathname}${req.nextUrl.search || ""}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    return finalizeResponse(NextResponse.redirect(signInUrl), pathname, startedAt);
  }

  // 5. Enforce role-based admin permission check for administrative routes
  const isAdminOnly = isPathMatch(pathname, adminOnlyPaths);
  if (isAdminOnly) {
    const allowlist = getAdminAllowlist();
    const requesterEmail = normalizeEmail((token as { email?: string }).email);
    const isAllowedAdmin = allowlist.size > 0 && requesterEmail && allowlist.has(requesterEmail);

    if (!isAllowedAdmin) {
      if (isApiRoute) {
        return finalizeResponse(
          NextResponse.json({ error: "Forbidden. Admin permission required." }, { status: 403 }),
          pathname,
          startedAt
        );
      }

      const fallback = new URL("/dashboard", req.url);
      return finalizeResponse(NextResponse.redirect(fallback), pathname, startedAt);
    }
  }

  // 6. User is authenticated and authorized to access requested resource
  return finalizeResponse(NextResponse.next(), pathname, startedAt);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
