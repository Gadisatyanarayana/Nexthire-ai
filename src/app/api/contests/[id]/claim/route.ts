import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonForbidden, jsonNotFound, jsonOk, jsonRateLimited, jsonUnauthorized } from "../../../../../lib/apiResponses";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(_req);
    const gate = await checkRateLimit({ key: `contest-claim:${ip}`, limit: 8, windowMs: 60_000 });
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
      return jsonError("Failed to read contest ownership.", 500);
    }
    if (!existingContest) {
      return jsonNotFound("Contest not found");
    }

    const currentOwner = String(existingContest.owner_user_id || "").trim();
    if (currentOwner && currentOwner !== String(userRow.id || "")) {
      return jsonForbidden("Contest already belongs to another owner.");
    }
    if (currentOwner === String(userRow.id || "")) {
      return jsonOk({ success: true, alreadyOwner: true });
    }

    const { error: updateError } = await supabase
      .from("contests")
      .update({ owner_user_id: userRow.id })
      .eq("id", contestId)
      .is("owner_user_id", null);

    if (updateError) {
      return jsonError("Failed to claim contest ownership.", 500);
    }

    return jsonOk({ success: true, ownerUserId: userRow.id });
  } catch (error) {
    console.error("Error in POST /api/contests/[id]/claim", error);
    return jsonError("Internal server error", 500);
  }
}
