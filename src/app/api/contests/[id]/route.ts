import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, isAdminEmail, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { computeLeaderboard } from "@/lib/contestLeaderboard";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonForbidden, jsonNotFound, jsonOk, jsonRateLimited, jsonUnauthorized } from "../../../../lib/apiResponses";

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

async function safeContestAcceptedRowsQuery(supabase: ReturnType<typeof getAdminClient>, contestId: string) {
  try {
    const { data } = await supabase
      .from("submissions")
      .select("user_id, question_id, result")
      .eq("contest_id", contestId)
      .not("question_id", "is", null)
      .in("result", ["accepted", "passed"]);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(_req);
    const gate = await checkRateLimit({ key: `contest-detail-read:${ip}`, limit: 120, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const supabase = getAdminClient();
    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();

    if (!contestId || !isUuid(contestId)) {
      return jsonBadRequest("Invalid contest id");
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
      return jsonError("Failed to fetch contest", 500);
    }

    if (!contest) {
      console.warn("Contest not found for ID:", contestId);
      return jsonNotFound("Contest not found");
    }

    const isOwner = Boolean(userRow?.id) && String(contest.owner_user_id || "") === String(userRow?.id || "");
    const canManageContest = isOwner || isAdminEmail(session.user.email);

    const userId = userRow.id;
    const [participantsRaw, submissionRowsRaw, contestQuestionRowsRaw, acceptedRowsRaw] = await Promise.all([
      safeParticipantsQuery(supabase, contestId),
      safeSubmissionRowsQuery(supabase, contestId, userId),
      safeContestQuestionIdsQuery(supabase, contestId),
      safeContestAcceptedRowsQuery(supabase, contestId),
    ]);

    const participants = participantsRaw as Array<{
      id: string;
      user_id: string;
      joined_at: string;
      finished_at: string | null;
      score: number | null;
      rank: number | null;
    }>;

    const uniqueParticipantsMap = new Map<string, (typeof participants)[number]>();
    for (const row of participants) {
      const userId = String(row.user_id || "").trim();
      if (!userId) continue;

      const existing = uniqueParticipantsMap.get(userId);
      if (!existing) {
        uniqueParticipantsMap.set(userId, row);
        continue;
      }

      const existingJoinedAt = existing.joined_at ? new Date(existing.joined_at).getTime() : Number.MAX_SAFE_INTEGER;
      const rowJoinedAt = row.joined_at ? new Date(row.joined_at).getTime() : Number.MAX_SAFE_INTEGER;
      if (rowJoinedAt < existingJoinedAt) {
        uniqueParticipantsMap.set(userId, row);
      }
    }

    const uniqueParticipants = Array.from(uniqueParticipantsMap.values());

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

    const acceptedByUser = new Map<string, Set<string>>();
    for (const row of acceptedRowsRaw as Array<{ user_id?: string | null; question_id?: string | null }>) {
      const submissionUserId = String(row.user_id || "").trim();
      const questionId = String(row.question_id || "").trim();
      if (!submissionUserId || !questionId) continue;
      const current = acceptedByUser.get(submissionUserId) || new Set<string>();
      current.add(questionId);
      acceptedByUser.set(submissionUserId, current);
    }

    const isParticipant = uniqueParticipants.some((row) => String(row.user_id || "") === String(userId || ""));
    if (contest.mode === "private" && !canManageContest && !isParticipant) {
      return jsonForbidden("Private contest access denied. Join with valid key first.");
    }

    // Fetch all submissions for the contest
    const { data: submissionsRaw } = await supabase
      .from("submissions")
      .select("user_id, question_id, result, code, runtime_ms, memory_kb, created_at")
      .eq("contest_id", contestId);
    const submissions = Array.isArray(submissionsRaw) ? submissionsRaw : [];

    // Fetch user profiles for all participants
    const participantUserIds = uniqueParticipants.map((item) => item.user_id);
    const { data: participantUsers } = participantUserIds.length
      ? await supabase
          .from("users")
          .select("id, email, name")
          .in("id", participantUserIds)
      : { data: [] };

    // Compute advanced leaderboard
    const contestDuration = Number(contest.duration_minutes || 90);
    const leaderboard = computeLeaderboard(
      uniqueParticipants,
      submissions,
      participantUsers || [],
      contestDuration
    );

    const questionSetLocked = uniqueParticipants.length > 0;

    return jsonOk({ contest, participants: uniqueParticipants, submissionStats, contestQuestionIds, leaderboard, isOwner: canManageContest, isParticipant, questionSetLocked, success: true });
  } catch (error) {
    console.error("Error in GET /api/contests/[id]", error);
    return jsonError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-settings-write:${ip}`, limit: 16, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId || !isUuid(contestId)) {
      return jsonBadRequest("Invalid contest id");
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
      return jsonBadRequest("Title must be at least 3 characters.");
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 300) {
      return jsonBadRequest("Duration must be between 15 and 300 minutes.");
    }
    if (body.startsAt && Number.isNaN(Date.parse(String(body.startsAt)))) {
      return jsonBadRequest("Invalid start time.");
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
      return jsonError("Failed to validate contest ownership.", 500);
    }
    if (!existingContest) {
      return jsonNotFound("Contest not found");
    }
    if (String(existingContest.owner_user_id || "") !== String(userRow.id || "") && !isAdminEmail(session.user.email)) {
      return jsonForbidden("Only contest owner can update settings.");
    }

    const { count: participantCount } = await supabase
      .from("contest_participants")
      .select("id", { count: "exact", head: true })
      .eq("contest_id", contestId);

    if ((participantCount || 0) > 0) {
      return jsonBadRequest("Cannot edit contest settings after participants have joined.");
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
      return jsonError("Failed to update contest settings.", 500);
    }

    return jsonOk({ contest: updatedContest, success: true });
  } catch (error) {
    console.error("Error in PATCH /api/contests/[id]", error);
    return jsonError("Internal server error", 500);
  }
}
