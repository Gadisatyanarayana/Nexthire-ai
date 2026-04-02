import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

async function safeParticipantsQuery(supabase: ReturnType<typeof getAdminClient>, contestId: string) {
  try {
    const { data } = await supabase
      .from("contest_participants")
      .select("id, user_id, joined_at, finished_at, score, rank")
      .eq("contest_id", contestId);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function safeSubmissionRowsQuery(supabase: ReturnType<typeof getAdminClient>, contestId: string, userId: string | null | undefined) {
  if (!userId) return [];

  try {
    const { data } = await supabase
      .from("submissions")
      .select("question_id, result")
      .eq("contest_id", contestId)
      .eq("user_id", userId)
      .not("question_id", "is", null);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function safeContestQuestionIdsQuery(supabase: ReturnType<typeof getAdminClient>, contestId: string) {
  try {
    const { data } = await supabase
      .from("contest_questions")
      .select("question_id")
      .eq("contest_id", contestId);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();

    if (!contestId || !isUuid(contestId)) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at, owner_user_id")
      .eq("id", contestId)
      .maybeSingle();

    if (contestError) {
      console.error("Error fetching contest:", contestError);
      return NextResponse.json({ 
        error: "Failed to fetch contest", 
        details: contestError.message 
      }, { status: 500 });
    }

    if (!contest) {
      console.warn("Contest not found for ID:", contestId);
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const isOwner = Boolean(userRow?.id) && String(contest.owner_user_id || "") === String(userRow?.id || "");

    const userId = userRow.id;
    const [participantsRaw, submissionRowsRaw, contestQuestionRowsRaw] = await Promise.all([
      safeParticipantsQuery(supabase, contestId),
      safeSubmissionRowsQuery(supabase, contestId, userId),
      safeContestQuestionIdsQuery(supabase, contestId),
    ]);

    const participants = participantsRaw as Array<{
      id: string;
      user_id: string;
      joined_at: string;
      finished_at: string | null;
      score: number | null;
      rank: number | null;
    }>;

    const submissionRows = submissionRowsRaw as Array<{ question_id: string | null; result: string | null }>;
    const acceptedSet = new Set<string>();
    for (const row of submissionRows) {
      const qid = String(row.question_id || "").trim();
      const result = String(row.result || "").toLowerCase();
      if (qid && (result === "accepted" || result === "passed")) {
        acceptedSet.add(qid);
      }
    }

    const submissionStats = {
      attemptedCount: submissionRows.length,
      acceptedCount: acceptedSet.size,
      acceptedQuestionIds: Array.from(acceptedSet),
    };

    const contestQuestionIds = Array.isArray(contestQuestionRowsRaw)
      ? contestQuestionRowsRaw.map((row: { question_id?: string }) => String(row.question_id || "")).filter(Boolean)
      : [];

    const leaderboardSeed = [...participants]
      .sort((a, b) => {
        const scoreA = typeof a.score === "number" ? a.score : -1;
        const scoreB = typeof b.score === "number" ? b.score : -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const timeA = a.finished_at ? new Date(a.finished_at).getTime() : Number.MAX_SAFE_INTEGER;
        const timeB = b.finished_at ? new Date(b.finished_at).getTime() : Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      })
      .slice(0, 100);

    const leaderboardUserIds = leaderboardSeed.map((item) => item.user_id);
    const { data: leaderboardUsers } = leaderboardUserIds.length
      ? await supabase
          .from("users")
          .select("id, email, name")
          .in("id", leaderboardUserIds)
      : { data: [] as Array<{ id: string; email: string | null; name: string | null }> };

    const userMap = new Map<string, { email: string; name: string }>();
    for (const row of leaderboardUsers || []) {
      userMap.set(String(row.id), {
        email: String(row.email || ""),
        name: String(row.name || ""),
      });
    }

    const leaderboard = leaderboardSeed.map((item, index) => ({
      rank: index + 1,
      userId: item.user_id,
      name: userMap.get(item.user_id)?.name || null,
      email: userMap.get(item.user_id)?.email || null,
      score: item.score ?? 0,
      finishedAt: item.finished_at,
    }));

    const questionSetLocked = participants.length > 0;

    return NextResponse.json({ contest, participants, submissionStats, contestQuestionIds, leaderboard, isOwner, questionSetLocked, success: true });
  } catch (error) {
    console.error("Error in GET /api/contests/[id]", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId || !isUuid(contestId)) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      description?: string | null;
      durationMinutes?: number;
      startsAt?: string | null;
    };

    const title = String(body.title || "").trim();
    const durationMinutes = Number(body.durationMinutes || 0);
    const startsAt = body.startsAt ? new Date(body.startsAt).toISOString() : null;

    if (title.length < 3) {
      return NextResponse.json({ error: "Title must be at least 3 characters." }, { status: 400 });
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 300) {
      return NextResponse.json({ error: "Duration must be between 15 and 300 minutes." }, { status: 400 });
    }
    if (body.startsAt && Number.isNaN(Date.parse(String(body.startsAt)))) {
      return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
    }

    const supabase = getAdminClient();
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

    const { data: existingContest, error: existingError } = await supabase
      .from("contests")
      .select("id, owner_user_id")
      .eq("id", contestId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Failed to validate contest ownership." }, { status: 500 });
    }
    if (!existingContest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }
    if (String(existingContest.owner_user_id || "") !== String(userRow.id || "")) {
      return NextResponse.json({ error: "Only contest owner can update settings." }, { status: 403 });
    }

    const { count: participantCount } = await supabase
      .from("contest_participants")
      .select("id", { count: "exact", head: true })
      .eq("contest_id", contestId);

    if ((participantCount || 0) > 0) {
      return NextResponse.json({ error: "Cannot edit contest settings after participants have joined." }, { status: 400 });
    }

    const { data: updatedContest, error: updateError } = await supabase
      .from("contests")
      .update({
        title,
        description: body.description?.trim() || null,
        duration_minutes: durationMinutes,
        starts_at: startsAt,
      })
      .eq("id", contestId)
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at, owner_user_id")
      .single();

    if (updateError || !updatedContest) {
      return NextResponse.json({ error: "Failed to update contest settings." }, { status: 500 });
    }

    return NextResponse.json({ contest: updatedContest, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
