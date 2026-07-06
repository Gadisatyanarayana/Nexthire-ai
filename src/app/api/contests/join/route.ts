import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonNotFound, jsonRateLimited, jsonUnauthorized, jsonError, jsonOk } from "../../../../lib/apiResponses";

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

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-join:${ip}`, limit: 12, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { joinCode } = body as { joinCode?: string };

    if (!joinCode || typeof joinCode !== "string") {
      return jsonBadRequest("joinCode is required");
    }

    const normalizedCode = joinCode.trim().toUpperCase();

    const supabase = getAdminClient();

    const { data: contest, error } = await supabase
      .from("contests")
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at")
      .eq("join_code", normalizedCode)
      .single();

    if (error || !contest) {
      return jsonNotFound("Contest not found");
    }

    if (contest.status === "cancelled") {
      return jsonBadRequest("Contest is cancelled");
    }

    if (contest.status === "active" || contest.status === "completed") {
      return jsonBadRequest("This contest has already started and admissions are locked by the creator.");
    }

    // Ensure user row exists
    const userRow = await upsertUserAdmin({
      name: session.user?.name ?? null,
      email: session.user.email,
    });

    const participantError = await ensureContestParticipant(contest.id, userRow.id, new Date().toISOString());

    if (participantError) {
      console.error("Error inserting contest_participants", participantError);
    }

    return jsonOk({ contest });
  } catch (error) {
    console.error("Unexpected error in POST /api/contests/join", error);
    return jsonError("Internal server error", 500);
  }
}
