import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";

type PerfEntry = {
  createdAt: string;
  avgTimeMs: number;
  avgMemoryKb: number;
};

function parseNum(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function readExecutionStats(feedbackRaw: unknown): { avgTimeMs: number | null; avgMemoryKb: number | null } {
  let feedback: Record<string, unknown> | null = null;

  if (typeof feedbackRaw === "string") {
    try {
      feedback = JSON.parse(feedbackRaw) as Record<string, unknown>;
    } catch {
      feedback = null;
    }
  } else if (feedbackRaw && typeof feedbackRaw === "object") {
    feedback = feedbackRaw as Record<string, unknown>;
  }

  const executionStats = (feedback?.executionStats || {}) as Record<string, unknown>;
  return {
    avgTimeMs: parseNum(executionStats.avgTimeMs),
    avgMemoryKb: parseNum(executionStats.avgMemoryKb),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((s, x) => s + x, 0) / values.length);
}

function trendLabel(latest: number | null, previous: number | null): "improving" | "stable" | "worse" | "unknown" {
  if (latest === null || previous === null) return "unknown";
  const diff = latest - previous;
  if (Math.abs(diff) <= Math.max(5, previous * 0.05)) return "stable";
  return diff < 0 ? "improving" : "worse";
}

function percentileLowerBetter(current: number | null, history: number[]): number | null {
  if (current === null || history.length === 0) return null;
  const slower = history.filter((x) => x >= current).length;
  return Math.max(0, Math.min(100, Math.round((slower / history.length) * 100)));
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const email = String(session?.user?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: questionId } = await context.params;
    const supabase = getAdminClient();

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (userError || !userRow?.id) {
      return NextResponse.json({ insights: null, recent: [] });
    }

    const { data: rows, error } = await supabase
      .from("submissions")
      .select("created_at, feedback")
      .eq("user_id", userRow.id)
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: globalRows } = await supabase
      .from("submissions")
      .select("feedback")
      .eq("question_id", questionId)
      .limit(500);

    const globalTimeValues = (globalRows || [])
      .map((row) => readExecutionStats((row as { feedback?: unknown }).feedback).avgTimeMs)
      .filter((x): x is number => x !== null);

    const globalMemoryValues = (globalRows || [])
      .map((row) => readExecutionStats((row as { feedback?: unknown }).feedback).avgMemoryKb)
      .filter((x): x is number => x !== null);

    const perfEntries: PerfEntry[] = (rows || [])
      .map((row) => {
        const stats = readExecutionStats((row as { feedback?: unknown }).feedback);
        if (stats.avgTimeMs === null || stats.avgMemoryKb === null) return null;
        return {
          createdAt: String((row as { created_at?: string }).created_at || ""),
          avgTimeMs: stats.avgTimeMs,
          avgMemoryKb: stats.avgMemoryKb,
        };
      })
      .filter((x): x is PerfEntry => Boolean(x));

    const recent = perfEntries.slice(0, 12);
    const allTimeValues = perfEntries.map((x) => x.avgTimeMs);
    const allMemoryValues = perfEntries.map((x) => x.avgMemoryKb);

    const latest5 = perfEntries.slice(0, 5);
    const previous5 = perfEntries.slice(5, 10);

    const latestTimeAvg = average(latest5.map((x) => x.avgTimeMs));
    const previousTimeAvg = average(previous5.map((x) => x.avgTimeMs));
    const latestMemoryAvg = average(latest5.map((x) => x.avgMemoryKb));
    const previousMemoryAvg = average(previous5.map((x) => x.avgMemoryKb));

    const url = new URL(req.url);
    const currentTimeMs = parseNum(url.searchParams.get("currentTimeMs"));
    const currentMemoryKb = parseNum(url.searchParams.get("currentMemoryKb"));

    const insights = {
      totalMeasuredRuns: perfEntries.length,
      avgTimeMs: average(allTimeValues),
      bestTimeMs: allTimeValues.length > 0 ? Math.min(...allTimeValues) : null,
      avgMemoryKb: average(allMemoryValues),
      bestMemoryKb: allMemoryValues.length > 0 ? Math.min(...allMemoryValues) : null,
      timeTrend: trendLabel(latestTimeAvg, previousTimeAvg),
      memoryTrend: trendLabel(latestMemoryAvg, previousMemoryAvg),
      currentRunPercentile: {
        time: percentileLowerBetter(currentTimeMs, globalTimeValues.length > 0 ? globalTimeValues : [45, 90, 120, 160, 220]),
        memory: percentileLowerBetter(currentMemoryKb, globalMemoryValues.length > 0 ? globalMemoryValues : [12000, 24000, 36000, 48000, 64000]),
      },
    };

    return NextResponse.json({ insights, recent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load performance insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
