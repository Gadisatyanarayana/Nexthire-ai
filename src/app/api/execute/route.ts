
import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { evaluateQuestion } from "@/judge/evaluator";
import { resolveLanguage } from "@/judge/languages";
import { enqueueJudgeJob } from "@/judge/queue";
import { setSubmissionState, waitForSubmission } from "@/judge/resultStore";
import type { JudgeCase, JudgeJobData, QuestionEvaluationPayload } from "@/judge/types";
import { hasHealthyJudgeWorker } from "@/judge/workerHealth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type ExecuteBody = {
  code?: string;
  language?: string;
  questionId?: string;
  testcases?: Array<{ input?: string; expectedOutput?: string; isHidden?: boolean }>;
  submit?: boolean;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  wait?: boolean;
};

const DEFAULT_EXECUTE_RATE_LIMIT_PER_MIN = 600;

function parseRateLimitPerMinute(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(60, Math.min(5000, Math.floor(parsed)));
}

const EXECUTE_RATE_LIMIT_PER_MIN = parseRateLimitPerMinute(
  process.env.JUDGE_EXECUTE_RATE_LIMIT_PER_MIN,
  DEFAULT_EXECUTE_RATE_LIMIT_PER_MIN
);
const JUDGE_SYNC_EXECUTE_INLINE = String(process.env.JUDGE_SYNC_EXECUTE_INLINE || "true").toLowerCase() !== "false";
const JUDGE_REQUIRE_WORKER = String(process.env.JUDGE_REQUIRE_WORKER || "false").toLowerCase() !== "false";

function buildRateLimitActor(req: NextRequest): string {
  const ip = getClientIp(req);
  const sessionCookie = req.cookies.get("__Secure-next-auth.session-token")?.value
    || req.cookies.get("next-auth.session-token")?.value
    || "";

  if (!sessionCookie) return ip;

  const fingerprint = createHash("sha256").update(sessionCookie).digest("hex").slice(0, 16);
  return `${ip}:${fingerprint}`;
}

function normalizeCaseList(raw: unknown): JudgeCase[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): JudgeCase | null => {
      const row = (entry || {}) as { input?: unknown; expectedOutput?: unknown; output?: unknown; isHidden?: unknown; hidden?: unknown };
      const input = String(row.input || "").trim();
      const expectedOutput = String(row.expectedOutput ?? row.output ?? "").trim();
      if (!input && !expectedOutput) return null;
      return {
        input,
        expectedOutput,
        isHidden: Boolean(row.isHidden ?? row.hidden ?? false),
      };
    })
    .filter((entry): entry is JudgeCase => entry !== null);
}

export async function POST(req: NextRequest) {
  try {
    const actor = buildRateLimitActor(req);
    const gate = await checkRateLimit({ key: `execute:${actor}`, limit: EXECUTE_RATE_LIMIT_PER_MIN, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `Too many execution requests. Try again in ${gate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as ExecuteBody;
    const code = String(body.code || "");
    if (!code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const language = resolveLanguage(body.language);
    if (!language) {
      return NextResponse.json({ error: "Unsupported language. Supported: javascript, python, cpp, java." }, { status: 400 });
    }

    const testcases = normalizeCaseList(body.testcases);
    const submissionId = randomUUID();
    const wait = body.wait !== false;

    const jobData: JudgeJobData = {
      submissionId,
      kind: "question-evaluation",
      requestedAt: Date.now(),
      mode: body.submit ? "submit" : "run",
      code,
      language,
      questionId: body.questionId,
      testcases: testcases.length > 0 ? testcases : [{ input: "", expectedOutput: "", isHidden: false }],
      functionName: body.functionName,
      inputType: body.inputType,
      outputType: body.outputType,
      caseSource: body.submit ? "platform" : "custom",
    };

    const runInline = async (warnings: string[] = []) => {
      const payload = await evaluateQuestion(jobData);

      const total = typeof payload.summary?.total === "number" ? payload.summary.total : payload.cases.length;
      const passed = typeof payload.summary?.passed === "number"
        ? payload.summary.passed
        : payload.cases.filter((item) => item.passed).length;

      return NextResponse.json({
        submission_id: submissionId,
        passed,
        total,
        ...payload,
        submissionProof: null,
        warnings: [
          ...(Array.isArray(payload.warnings) ? payload.warnings : []),
          ...warnings,
        ],
      });
    };

    if (JUDGE_SYNC_EXECUTE_INLINE) {
      return runInline([
        wait ? "Inline fast-path execution enabled." : "Inline fast-path execution enabled for run mode.",
      ]);
    }

    if (wait) {
      const workerHealthy = await hasHealthyJudgeWorker();
      if (!workerHealthy) {
        if (JUDGE_REQUIRE_WORKER) {
          return NextResponse.json(
            { error: "Judge worker is offline. Start judge worker and retry." },
            { status: 503 }
          );
        }
        return runInline(["Worker offline fallback: executed directly in API process."]);
      }

      try {
        await setSubmissionState(submissionId, "queued");
        await enqueueJudgeJob(jobData);
      } catch (error) {
        if (JUDGE_REQUIRE_WORKER) {
          return NextResponse.json(
            { error: "Judge queue unavailable. Ensure Redis and judge worker are running." },
            { status: 503 }
          );
        }
        const message = error instanceof Error ? error.message : "Queue unavailable";
        return runInline([`Queue fallback: ${message}`]);
      }
    } else {
      setTimeout(() => {
        void (async () => {
          try {
            await setSubmissionState(submissionId, "queued");
            await enqueueJudgeJob(jobData);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Queue unavailable";
            try {
              await setSubmissionState(submissionId, "failed", { error: `Judge queue unavailable. ${message}` });
            } catch {
              // Best-effort state persistence.
            }
          }
        })();
      }, 0);
    }

    if (!wait) {
      return NextResponse.json({
        submission_id: submissionId,
        state: "queued",
      });
    }

    const envelope = await waitForSubmission(submissionId, { timeoutMs: 60_000, pollMs: 300 });
    if (!envelope) {
      return NextResponse.json(
        {
          submission_id: submissionId,
          state: "queued",
          message: "Execution is still running. Poll GET /api/result/{submission_id}.",
        },
        { status: 202 }
      );
    }

    if (envelope.state === "failed") {
      return NextResponse.json(
        {
          submission_id: submissionId,
          error: envelope.error || "Code execution failed",
        },
        { status: 500 }
      );
    }

    const payload = envelope.data as QuestionEvaluationPayload | undefined;
    if (!payload) {
      return NextResponse.json({ error: "Missing execution payload" }, { status: 500 });
    }

    const total = typeof payload.summary?.total === "number" ? payload.summary.total : payload.cases.length;
    const passed = typeof payload.summary?.passed === "number"
      ? payload.summary.passed
      : payload.cases.filter((item) => item.passed).length;

    return NextResponse.json({
      submission_id: submissionId,
      passed,
      total,
      ...payload,
      submissionProof: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Code execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
