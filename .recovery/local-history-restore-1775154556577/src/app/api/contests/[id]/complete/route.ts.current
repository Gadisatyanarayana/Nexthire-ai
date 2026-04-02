import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type CompleteBody = {
  selectedQuestionIds?: string[];
  attemptedCount?: number;
  acceptedCount?: number;
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

function computeRating(acceptanceRate: number, attemptedCount: number): number {
  if (attemptedCount === 0) return 900;
  const base = 900;
  const quality = Math.round(acceptanceRate * 7);
  const volume = Math.min(300, attemptedCount * 25);
  return Math.min(2100, base + quality + volume);
}

export async function POST(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as CompleteBody;
    const selectedQuestionIds = Array.isArray(body.selectedQuestionIds) ? body.selectedQuestionIds.filter(Boolean) : [];
    const attemptedCount = toInt(body.attemptedCount);
    const acceptedCount = Math.min(toInt(body.acceptedCount), attemptedCount);
    const acceptanceRate = attemptedCount > 0 ? Math.round((acceptedCount / attemptedCount) * 100) : 0;
    const rating = computeRating(acceptanceRate, attemptedCount);
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
          finished_at: body.endedAt || new Date().toISOString(),
          score: acceptedCount,
        },
        { onConflict: "contest_id,user_id" }
      );

    if (participantError) {
      console.error("Failed to upsert contest participant", participantError);
    }

    const summaryPayload = {
      type: "contest_summary",
      timedOut: Boolean(body.timedOut),
      selectedCount: selectedQuestionIds.length,
      attemptedCount,
      acceptedCount,
      acceptanceRate,
      rating,
      suggestions,
      startedAt: body.startedAt || null,
      endedAt: body.endedAt || new Date().toISOString(),
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
      return NextResponse.json({ error: "Failed to store contest summary" }, { status: 500 });
    }

    return NextResponse.json({
      message: Boolean(body.timedOut) ? "Time exceeded" : "Contest completed",
      summary: summaryPayload,
    });
  } catch (error) {
    console.error("Error in POST /api/contests/[id]/complete", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
