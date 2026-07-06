import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonOk, jsonRateLimited, jsonUnauthorized } from "../../../../../lib/apiResponses";

type CompleteBody = {
  selectedQuestionIds?: string[];
  attemptedCount?: number;
  acceptedCount?: number;
  acceptedQuestionIds?: string[];
  startedAt?: string;
  endedAt?: string;
  timedOut?: boolean;
};

function toInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function buildSuggestions(acceptanceRate: number, attemptedCount: number): string[] {
  const suggestions: string[] = [];
  if (attemptedCount === 0) {
    suggestions.push("Attempt at least one question before finishing the contest.");
    return suggestions;
  }
  if (acceptanceRate < 40) suggestions.push("Focus on correctness first. Run custom test cases before final submit.");
  if (acceptanceRate >= 40 && acceptanceRate < 70) suggestions.push("Good progress. Improve edge-case handling and time complexity.");
  if (acceptanceRate >= 70) suggestions.push("Strong performance. Practice one harder problem to increase interview readiness.");
  suggestions.push("Review failed attempts and write down recurring mistakes.");
  return suggestions;
}

function computeRating(acceptanceRate: number, attemptedCount: number, elapsedMinutes: number | null): number {
  if (attemptedCount === 0) return 900;
  const base = 900;
  const quality = Math.round(acceptanceRate * 7);
  const volume = Math.min(300, attemptedCount * 25);
  const speedBonus = elapsedMinutes === null
    ? 0
    : elapsedMinutes <= 20
    ? 120
    : elapsedMinutes <= 35
    ? 80
    : elapsedMinutes <= 50
    ? 40
    : 0;
  return Math.min(2100, base + quality + volume + speedBonus);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-complete:${ip}`, limit: 10, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId) {
      return jsonBadRequest("Invalid contest id");
    }

    const body = (await req.json().catch(() => ({}))) as CompleteBody;
    const selectedQuestionIds = Array.isArray(body.selectedQuestionIds) ? body.selectedQuestionIds.filter(Boolean) : [];
    const acceptedQuestionIds = new Set(Array.isArray(body.acceptedQuestionIds) ? body.acceptedQuestionIds.filter(Boolean) : []);
    const attemptedCount = toInt(body.attemptedCount);
    const acceptedCount = Math.min(toInt(body.acceptedCount), attemptedCount);
    const acceptanceRate = attemptedCount > 0 ? Math.round((acceptedCount / attemptedCount) * 100) : 0;
    const endedAtIso = body.endedAt || new Date().toISOString();
    const startedMs = body.startedAt ? Date.parse(body.startedAt) : Number.NaN;
    const endedMs = Date.parse(endedAtIso);
    const elapsedSeconds = Number.isFinite(startedMs) && Number.isFinite(endedMs)
      ? Math.max(0, Math.round((endedMs - startedMs) / 1000))
      : null;
    const elapsedMinutes = elapsedSeconds === null ? null : Math.ceil(elapsedSeconds / 60);
    const rating = computeRating(acceptanceRate, attemptedCount, elapsedMinutes);
    const suggestions = buildSuggestions(acceptanceRate, attemptedCount);

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email).trim().toLowerCase(),
    });

    const supabase = getAdminClient();

    const { error: participantError } = await supabase
      .from("contest_participants")
      .upsert(
        {
          contest_id: contestId,
          user_id: user.id,
           joined_at: body.startedAt || new Date().toISOString(),
           finished_at: endedAtIso,
          score: acceptedCount,
        },
        { onConflict: "contest_id,user_id" }
      );

    if (participantError) {
      console.error("Failed to upsert contest participant", participantError);
    }

    const { data: perQuestionRows } = selectedQuestionIds.length
      ? await supabase
          .from("submissions")
          .select("question_id, result, created_at")
          .eq("contest_id", contestId)
          .eq("user_id", user.id)
          .in("question_id", selectedQuestionIds)
          .not("question_id", "is", null)
      : { data: [] as Array<{ question_id: string | null; result: string | null; created_at: string | null }> };

    const grouped = new Map<string, Array<{ result: string; createdAt: number }>>();
    for (const row of perQuestionRows || []) {
      const qid = String(row.question_id || "").trim();
      if (!qid) continue;
      const list = grouped.get(qid) || [];
      list.push({
        result: String(row.result || "").toLowerCase(),
        createdAt: Number.isFinite(Date.parse(String(row.created_at || ""))) ? Date.parse(String(row.created_at || "")) : 0,
      });
      grouped.set(qid, list);
    }

    const questionBreakdown = selectedQuestionIds.map((qid) => {
      const attempts = grouped.get(qid) || [];
      const last = attempts.sort((a, b) => a.createdAt - b.createdAt)[attempts.length - 1];
      const accepted = acceptedQuestionIds.has(qid) || attempts.some((a) => a.result === "accepted" || a.result === "passed");
      return {
        questionId: qid,
        attempts: attempts.length,
        accepted,
        lastResult: last?.result || "not_attempted",
      };
    });

    const summaryPayload = {
      type: "contest_summary",
      timedOut: Boolean(body.timedOut),
      selectedCount: selectedQuestionIds.length,
      attemptedCount,
      acceptedCount,
      acceptanceRate,
      rating,
      questionBreakdown,
      suggestions,
      startedAt: body.startedAt || null,
      endedAt: endedAtIso,
      timeTakenSeconds: elapsedSeconds,
      timeTakenMinutes: elapsedMinutes,
    };

    const { error: summaryError } = await supabase.from("submissions").insert({
      user_id: user.id,
      contest_id: contestId,
      question_id: null,
      language: "contest",
      code: JSON.stringify({ selectedQuestionIds }),
      output: `${acceptedCount}/${Math.max(1, selectedQuestionIds.length)} accepted`,
      result: Boolean(body.timedOut) ? "time_exceeded" : "completed",
      feedback: JSON.stringify(summaryPayload),
      difficulty: "contest",
    });

    if (summaryError) {
      console.error("Failed to store contest summary", summaryError);
      return jsonError("Failed to store contest summary", 500);
    }

    return jsonOk({
      message: Boolean(body.timedOut) ? "Time exceeded" : "Contest completed",
      summary: summaryPayload,
    });
  } catch (error) {
    console.error("Error in POST /api/contests/[id]/complete", error);
    return jsonError("Internal server error", 500);
  }
}
