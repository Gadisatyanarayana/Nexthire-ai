import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type SubmissionRow = {
  id: string;
  user_id: string;
  language: string | null;
  result: string | null;
  passed_count: number | null;
  total_count: number | null;
  runtime_ms: number | null;
  memory_kb: number | null;
  failed_input: string | null;
  feedback: string | null;
  created_at: string | null;
};

function isAccepted(result: string | null | undefined): boolean {
  const normalized = String(result || "").toLowerCase();
  return normalized === "accepted" || normalized === "passed";
}

function safeParseFeedback(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readRuntimeMs(row: SubmissionRow): number | null {
  if (typeof row.runtime_ms === "number" && Number.isFinite(row.runtime_ms)) {
    return row.runtime_ms;
  }

  const feedback = safeParseFeedback(row.feedback);
  const executionStats = (feedback.executionStats || feedback.execution_stats || null) as
    | { avgTimeMs?: unknown }
    | null;
  return toNumber(executionStats?.avgTimeMs);
}

function readMemoryKb(row: SubmissionRow): number | null {
  if (typeof row.memory_kb === "number" && Number.isFinite(row.memory_kb)) {
    return row.memory_kb;
  }

  const feedback = safeParseFeedback(row.feedback);
  const executionStats = (feedback.executionStats || feedback.execution_stats || null) as
    | { avgMemoryKb?: unknown }
    | null;
  return toNumber(executionStats?.avgMemoryKb);
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const questionId = String(id || "").trim();
    if (!questionId) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const admin = getAdminClient();

    const { data, error } = await admin
      .from("submissions")
      .select("id, user_id, language, result, passed_count, total_count, runtime_ms, memory_kb, failed_input, feedback, created_at")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(1500);

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to load submissions" }, { status: 500 });
    }

    const rows = (Array.isArray(data) ? data : []) as SubmissionRow[];
    const totalSubmissions = rows.length;
    const acceptedSubmissions = rows.filter((row) => isAccepted(row.result)).length;
    const acceptedPercent = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 10000) / 100
      : 0;

    const byUser = new Map<
      string,
      {
        userId: string;
        accepted: number;
        total: number;
        bestRuntimeMs: number | null;
        bestMemoryKb: number | null;
      }
    >();

    for (const row of rows) {
      const existing = byUser.get(row.user_id) || {
        userId: row.user_id,
        accepted: 0,
        total: 0,
        bestRuntimeMs: null,
        bestMemoryKb: null,
      };

      existing.total += 1;
      if (isAccepted(row.result)) {
        existing.accepted += 1;

        const runtime = readRuntimeMs(row);
        if (runtime !== null) {
          existing.bestRuntimeMs = existing.bestRuntimeMs === null ? runtime : Math.min(existing.bestRuntimeMs, runtime);
        }

        const memory = readMemoryKb(row);
        if (memory !== null) {
          existing.bestMemoryKb = existing.bestMemoryKb === null ? memory : Math.min(existing.bestMemoryKb, memory);
        }
      }

      byUser.set(row.user_id, existing);
    }

    const userIds = Array.from(byUser.keys());
    const { data: users } = userIds.length > 0
      ? await admin.from("users").select("id, name, email").in("id", userIds)
      : { data: [] as Array<{ id: string; name: string | null; email: string | null }> };

    const nameById = new Map<string, string>();
    for (const user of users || []) {
      const label = String(user.name || user.email || "Anonymous").trim() || "Anonymous";
      nameById.set(String(user.id), label);
    }

    const leaderboard = Array.from(byUser.values())
      .map((entry) => ({
        userId: entry.userId,
        name: nameById.get(entry.userId) || "Anonymous",
        acceptedCount: entry.accepted,
        totalSubmissions: entry.total,
        acceptancePercent: entry.total > 0 ? Math.round((entry.accepted / entry.total) * 10000) / 100 : 0,
        bestRuntimeMs: entry.bestRuntimeMs,
        bestMemoryKb: entry.bestMemoryKb,
      }))
      .sort((a, b) => {
        if (b.acceptedCount !== a.acceptedCount) return b.acceptedCount - a.acceptedCount;
        const runtimeA = a.bestRuntimeMs ?? Number.POSITIVE_INFINITY;
        const runtimeB = b.bestRuntimeMs ?? Number.POSITIVE_INFINITY;
        if (runtimeA !== runtimeB) return runtimeA - runtimeB;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));

    const acceptedRows = rows.filter((row) => isAccepted(row.result));
    const runtimeSeries = acceptedRows
      .map((row) => readRuntimeMs(row))
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);
    const memorySeries = acceptedRows
      .map((row) => readMemoryKb(row))
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    const benchmark = {
      runtimeMs: {
        best: runtimeSeries.length > 0 ? runtimeSeries[0] : null,
        p50: percentile(runtimeSeries, 50),
        p90: percentile(runtimeSeries, 90),
      },
      memoryKb: {
        best: memorySeries.length > 0 ? memorySeries[0] : null,
        p50: percentile(memorySeries, 50),
        p90: percentile(memorySeries, 90),
      },
    };

    let history: Array<{
      id: string;
      result: string;
      language: string;
      passed: number;
      total: number;
      runtimeMs: number | null;
      memoryKb: number | null;
      failedInput: string | null;
      createdAt: string | null;
    }> = [];

    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await upsertUserAdmin({
        name: session.user.name ?? null,
        email: String(session.user.email).trim().toLowerCase(),
      });

      history = rows
        .filter((row) => row.user_id === user.id)
        .slice(0, 25)
        .map((row) => ({
          id: row.id,
          result: String(row.result || "Unknown"),
          language: String(row.language || "-").toLowerCase(),
          passed: typeof row.passed_count === "number" ? row.passed_count : 0,
          total: typeof row.total_count === "number" ? row.total_count : 0,
          runtimeMs: readRuntimeMs(row),
          memoryKb: readMemoryKb(row),
          failedInput: row.failed_input || null,
          createdAt: row.created_at || null,
        }));
    }

    return NextResponse.json(
      {
        acceptedPercent,
        totals: {
          submissions: totalSubmissions,
          accepted: acceptedSubmissions,
          uniqueUsers: byUser.size,
        },
        benchmark,
        leaderboard,
        history,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=20",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submission analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
