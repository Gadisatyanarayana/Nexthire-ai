import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminOnlyPaths = ["/admin", "/api/admin"];

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

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAdminOnly = isPathMatch(pathname, adminOnlyPaths);
  const isApiRoute = pathname.startsWith("/api/");

  if (req.method === "OPTIONS") {
    return withSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isApiRoute) {
      return withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return withSecurityHeaders(NextResponse.redirect(signInUrl));
  }

  if (isAdminOnly) {
    const allowlist = getAdminAllowlist();
    const requesterEmail = normalizeEmail((token as { email?: string }).email);
    const isAllowedAdmin = allowlist.size > 0 && requesterEmail && allowlist.has(requesterEmail);

    if (!isAllowedAdmin) {
      if (isApiRoute) {
        return withSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
      }

      const fallback = new URL("/dashboard", req.url);
      return withSecurityHeaders(NextResponse.redirect(fallback));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-resume/:path*",
    "/resume-analyzer/:path*",
    "/resume-builder/:path*",
    "/coding/:path*",
    "/question/:path*",
    "/contests/:path*",
    "/chatbot/:path*",
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
  ],
};
