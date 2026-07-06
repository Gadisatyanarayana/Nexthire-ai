import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type PersistBody = {
  code?: string;
  language?: "cpp" | "java" | "python" | "javascript";
  result?: string;
  contestId?: string | null;
  cases?: Array<{
    status?: string;
    passed?: boolean;
    input?: string;
    output?: string;
  }>;
  executionStats?: {
    avgTimeMs?: number | null;
    maxTimeMs?: number | null;
    avgMemoryKb?: number | null;
    maxMemoryKb?: number | null;
    measuredCases?: number;
  } | null;
  skillReport?: unknown;
  submissionProof?: {
    token?: string;
    expiresAt?: number;
  } | null;
};

function hashCode(value: string): string {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function verifySubmissionProof(payload: {
  token: string;
  questionId: string;
  language: "cpp" | "java" | "python" | "javascript";
  codeHash: string;
}): boolean {
  const secret = process.env.SUBMISSION_PROOF_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (!secret) return false;

  const parts = String(payload.token || "").split(".");
  if (parts.length !== 2) return false;

  const expiresAt = Number(parts[0]);
  const receivedSig = String(parts[1] || "").trim();
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  if (!receivedSig || receivedSig.length < 32) return false;

  const base = `${payload.questionId}|${payload.language}|${payload.codeHash}|${expiresAt}`;
  const expectedSig = createHmac("sha256", secret).update(base).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const questionId = String(resolvedParams?.id || "").trim();
    if (!questionId) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as PersistBody;
    const code = String(body.code || "");
    const language = body.language;
    const result = String(body.result || "");
    const token = String(body.submissionProof?.token || "").trim();

    if (!code.trim() || !language) {
      return NextResponse.json({ error: "Code and language are required" }, { status: 400 });
    }
    if (result !== "Accepted") {
      return NextResponse.json({ error: "Only accepted submissions can be persisted" }, { status: 400 });
    }

    const cases = Array.isArray(body.cases) ? body.cases : [];
    if (cases.length === 0 || !cases.every((item) => Boolean(item?.passed))) {
      return NextResponse.json({ error: "All test cases must pass before persistence" }, { status: 400 });
    }

    const proofValid = verifySubmissionProof({
      token,
      questionId,
      language,
      codeHash: hashCode(code),
    });

    if (!proofValid) {
      return NextResponse.json({ error: "Invalid or expired submission proof. Please submit again." }, { status: 403 });
    }

    const supabase = getAdminClient();

    const { data: questionRow } = await supabase
      .from("questions")
      .select("id, difficulty")
      .eq("id", questionId)
      .maybeSingle();

    if (!questionRow) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email).trim().toLowerCase(),
    });

    const { error: insertError } = await supabase.from("submissions").insert({
      user_id: user.id,
      question_id: questionId,
      contest_id: body.contestId || null,
      language,
      code,
      output: result,
      result,
      difficulty: String(questionRow.difficulty || "").toLowerCase() || "unknown",
      feedback: JSON.stringify({
        type: "problem_submission",
        perCase: cases.map((item) => ({
          status: String(item.status || ""),
          passed: Boolean(item.passed),
          input: String(item.input || ""),
          output: String(item.output || ""),
        })),
        executionStats: body.executionStats || null,
        skillReport: body.skillReport || null,
      }),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message || "Failed to persist submission" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
