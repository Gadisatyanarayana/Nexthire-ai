import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type SubmissionRow = {
  id: string;
  question_id: string | null;
  language: string | null;
  code: string | null;
  result: string | null;
  runtime: string | null;
  memory: string | null;
  runtime_ms: number | null;
  memory_kb: number | null;
  passed_count: number | null;
  total_count: number | null;
  created_at: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseLimit(raw: string | null): number {
  if (!raw) return 50;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(200, Math.max(1, Math.floor(parsed)));
}

function toRuntimeLabel(row: SubmissionRow): string {
  if (row.runtime && row.runtime.trim()) return row.runtime;
  if (typeof row.runtime_ms === "number" && Number.isFinite(row.runtime_ms)) {
    return `${Math.max(0, Math.round(row.runtime_ms))} ms`;
  }
  return "-";
}

function toMemoryLabel(row: SubmissionRow): string {
  if (row.memory && row.memory.trim()) return row.memory;
  if (typeof row.memory_kb === "number" && Number.isFinite(row.memory_kb)) {
    return `${(Math.max(0, row.memory_kb) / 1024).toFixed(2)} MB`;
  }
  return "-";
}

function normalizeStatus(row: SubmissionRow): string {
  const raw = String(row.result || "Unknown").trim();
  if (!raw) return "Unknown";
  const normalized = raw.toLowerCase();
  if (normalized === "passed") return "Accepted";
  if (normalized === "accepted") return "Accepted";
  if (normalized === "wrong answer") return "Wrong Answer";
  return raw;
}

function isAcceptedStatus(status: string): boolean {
  const normalized = String(status || "").toLowerCase();
  return normalized === "accepted" || normalized === "passed";
}

async function resolveProblemContext(problemIdRaw: string) {
  const admin = getAdminClient();
  const requested = String(problemIdRaw || "").trim();
  if (!requested) return { requested: "", problemId: null as string | null, questionId: null as string | null };

  if (isUuid(requested)) {
    const { data } = await admin
      .from("problems")
      .select("id, legacy_question_id")
      .eq("id", requested)
      .maybeSingle();

    if (data?.id) {
      return {
        requested,
        problemId: String(data.id),
        questionId: data.legacy_question_id ? String(data.legacy_question_id) : null,
      };
    }
  }

  const { data } = await admin
    .from("problems")
    .select("id, legacy_question_id")
    .eq("legacy_question_id", requested)
    .maybeSingle();

  if (data?.id) {
    return {
      requested,
      problemId: String(data.id),
      questionId: data.legacy_question_id ? String(data.legacy_question_id) : requested,
    };
  }

  return {
    requested,
    problemId: null,
    questionId: requested,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const requestedProblemId = String(req.nextUrl.searchParams.get("problem_id") || "").trim();
    if (!requestedProblemId) {
      return NextResponse.json({ error: "problem_id is required" }, { status: 400 });
    }

    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email || "").trim().toLowerCase(),
    });

    const resolved = await resolveProblemContext(requestedProblemId);
    const admin = getAdminClient();

    const questionIdFilter = resolved.questionId || requestedProblemId;

    const query = admin
      .from("submissions")
      .select(
        "id, question_id, language, code, result, runtime, memory, runtime_ms, memory_kb, passed_count, total_count, created_at"
      )
      .eq("user_id", user.id)
      .is("contest_id", null)
      .eq("question_id", questionIdFilter)
      .order("created_at", { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to load submissions" }, { status: 500 });
    }

    const rows = (Array.isArray(data) ? data : []) as SubmissionRow[];

    const history = rows.map((row) => {
      const status = normalizeStatus(row);
      return {
        id: row.id,
        question_id: row.question_id,
        status,
        language: String(row.language || "-").toLowerCase(),
        runtime: toRuntimeLabel(row),
        memory: toMemoryLabel(row),
        runtime_ms: typeof row.runtime_ms === "number" ? row.runtime_ms : null,
        memory_kb: typeof row.memory_kb === "number" ? row.memory_kb : null,
        passed: typeof row.passed_count === "number" ? row.passed_count : 0,
        total: typeof row.total_count === "number" ? row.total_count : 0,
        created_at: row.created_at,
        code: row.code || "",
      };
    });

    const acceptedRow = rows.find((row) => isAcceptedStatus(normalizeStatus(row))) || null;
    const lastAccepted = acceptedRow
      ? {
          id: acceptedRow.id,
          status: normalizeStatus(acceptedRow),
          language: String(acceptedRow.language || "-").toLowerCase(),
          runtime: toRuntimeLabel(acceptedRow),
          memory: toMemoryLabel(acceptedRow),
          runtime_ms: typeof acceptedRow.runtime_ms === "number" ? acceptedRow.runtime_ms : null,
          memory_kb: typeof acceptedRow.memory_kb === "number" ? acceptedRow.memory_kb : null,
          passed: typeof acceptedRow.passed_count === "number" ? acceptedRow.passed_count : 0,
          total: typeof acceptedRow.total_count === "number" ? acceptedRow.total_count : 0,
          created_at: acceptedRow.created_at,
          code: acceptedRow.code || "",
        }
      : null;

    return NextResponse.json(
      {
        question_id: resolved.questionId || requestedProblemId,
        history,
        lastAccepted,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load submissions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
