import { NextResponse } from "next/server";

function isConfigured(value: string | undefined): boolean {
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.startsWith("REPLACE_WITH_NEW_")) return false;
  return true;
}

export async function GET() {
  const now = Date.now();
  const uptimeSeconds = Math.floor(process.uptime());

  const checks = {
    nextAuthSecret: isConfigured(process.env.NEXTAUTH_SECRET),
    googleClientId: isConfigured(process.env.GOOGLE_CLIENT_ID),
    googleClientSecret: isConfigured(process.env.GOOGLE_CLIENT_SECRET),
    supabaseUrl: isConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: isConfigured(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY),
    groqApiKey: isConfigured(process.env.GROQ_API_KEY),
  };

  const authReady = checks.nextAuthSecret && checks.googleClientId && checks.googleClientSecret;
  const aiReady = checks.groqApiKey;
  const dbReady = checks.supabaseUrl && checks.supabaseAnonKey && checks.supabaseServiceRoleKey;

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date(now).toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || "development",
      checks,
      readiness: {
        authReady,
        dbReady,
        aiReady,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
