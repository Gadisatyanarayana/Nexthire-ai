import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonNotFound, jsonOk, jsonRateLimited, jsonUnauthorized } from "../../../../../lib/apiResponses";

async function ensureContestParticipant(contestId: string, userId: string, joinedAt: string) {
  const admin = getAdminClient();
  const { data: existingRows, error: existingError } = await admin
    .from("contest_participants")
    .select("id")
    .eq("contest_id", contestId)
    .eq("user_id", userId)
    .limit(1);

  if (existingError) return existingError;
  if (Array.isArray(existingRows) && existingRows.length > 0) return null;

  const { error: insertError } = await admin.from("contest_participants").insert({
    contest_id: contestId,
    user_id: userId,
    joined_at: joinedAt,
  });

  return insertError || null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-join-public:${ip}`, limit: 20, windowMs: 60_000 });
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

    const body = await req.json().catch(() => ({}));
    const joinKey = typeof body?.joinKey === "string" ? body.joinKey.trim() : null;

    const admin = getAdminClient();
    const { data: contest, error: contestError } = await admin
      .from("contests")
      .select("id, mode, status, join_code, starts_at")
      .eq("id", contestId)
      .maybeSingle();

    if (contestError || !contest) {
      return jsonNotFound("Contest not found");
    }

    if (contest.status === "cancelled") {
      return jsonBadRequest("Contest is cancelled");
    }

    const hasStarted = (contest.starts_at && Date.now() >= new Date(contest.starts_at).getTime()) ||
                      contest.status === "active" ||
                      contest.status === "live" ||
                      contest.status === "completed";

    if (hasStarted) {
      return jsonBadRequest("This contest has already started and admissions are locked.");
    }

    if (contest.mode === "private") {
      if (!joinKey) {
        return jsonBadRequest("Join key is required for private contests.");
      }
      if (joinKey.toLowerCase() !== String(contest.join_code).toLowerCase()) {
        return jsonBadRequest("Invalid join key.");
      }
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email).trim().toLowerCase(),
    });

    const participantError = await ensureContestParticipant(contestId, user.id, new Date().toISOString());

    if (participantError) {
      console.error("Error inserting public contest participant", participantError);
      return jsonError("Failed to join public contest", 500);
    }

    return jsonOk({ success: true, contestId });
  } catch (error) {
    console.error("Error in POST /api/contests/[id]/join", error);
    return jsonError("Failed to join contest", 500);
  }
}
