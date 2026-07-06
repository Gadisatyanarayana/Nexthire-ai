import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getSubmissionEnvelope } from "@/judge/resultStore";

const DEFAULT_RESULT_RATE_LIMIT_PER_MIN = 3000;

function parseRateLimitPerMinute(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(120, Math.min(20_000, Math.floor(parsed)));
}

const RESULT_RATE_LIMIT_PER_MIN = parseRateLimitPerMinute(
  process.env.JUDGE_RESULT_RATE_LIMIT_PER_MIN,
  DEFAULT_RESULT_RATE_LIMIT_PER_MIN
);

function buildRateLimitActor(req: NextRequest): string {
  const ip = getClientIp(req);
  const sessionCookie = req.cookies.get("__Secure-next-auth.session-token")?.value
    || req.cookies.get("next-auth.session-token")?.value
    || "";

  if (!sessionCookie) return ip;

  const fingerprint = createHash("sha256").update(sessionCookie).digest("hex").slice(0, 16);
  return `${ip}:${fingerprint}`;
}

export async function GET(
  req: NextRequest,
  context: { params: { submission_id: string } | Promise<{ submission_id: string }> }
) {
  try {
    const actor = buildRateLimitActor(req);
    const params = await Promise.resolve(context.params);
    const submissionId = String(params?.submission_id || "").trim();
    if (!submissionId) {
      return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
    }

    const gate = await checkRateLimit({
      key: `result:${submissionId}:${actor}`,
      limit: RESULT_RATE_LIMIT_PER_MIN,
      windowMs: 60_000,
    });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `Too many result requests. Retry in ${gate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const envelope = await getSubmissionEnvelope(submissionId);
    if (!envelope) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json(envelope, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch result";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
