import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

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

  let dbLiveReady = false;
  let dbLiveError: string | null = null;
  let questionCount: number | null = null;

  if (dbReady) {
    try {
      const admin = getAdminClient();
      const [{ count, error }, { data: metaData, error: metaError }] = await Promise.all([
        admin.from("questions").select("id", { count: "exact", head: true }),
        admin.from("app_meta").select("value").eq("key", "questions_last_sync_at").maybeSingle(),
      ]);

      if (error) {
        throw error;
      }

      if (metaError) {
        throw metaError;
      }

      questionCount = typeof count === "number" ? count : null;
      dbLiveReady = true;

      return NextResponse.json(
        {
          status: "ok",
          timestamp: new Date(now).toISOString(),
          uptimeSeconds,
          environment: process.env.NODE_ENV || "development",
          checks,
          liveDb: {
            ready: dbLiveReady,
            questionCount,
            lastSyncAt: typeof metaData?.value === "string" ? metaData.value : null,
            error: dbLiveError,
          },
          readiness: {
            authReady,
            dbReady,
            dbLiveReady,
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
    } catch (error) {
      dbLiveError = error instanceof Error ? error.message : "Database probe failed";
    }
  }

  return NextResponse.json(
    {
      status: dbReady ? "degraded" : "unhealthy",
      timestamp: new Date(now).toISOString(),
      uptimeSeconds,
      environment: process.env.NODE_ENV || "development",
      checks,
      liveDb: {
        ready: dbLiveReady,
        questionCount,
        lastSyncAt: null,
        error: dbLiveError || (dbReady ? "Unable to probe database" : "Database env vars missing"),
      },
      readiness: {
        authReady,
        dbReady,
        dbLiveReady,
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
