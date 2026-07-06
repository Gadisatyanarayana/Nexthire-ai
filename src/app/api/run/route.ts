
import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { evaluateQuestion, evaluateRawRun } from "@/judge/evaluator";
import { resolveLanguage } from "@/judge/languages";
import { loadProblemCases } from "@/judge/problemCases";
import { enqueueJudgeJob } from "@/judge/queue";
import { setSubmissionState, waitForSubmission } from "@/judge/resultStore";
import type { JudgeCase, JudgeJobData, QuestionEvaluationPayload, RawRunPayload } from "@/judge/types";
import { hasHealthyJudgeWorker } from "@/judge/workerHealth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

type RunBody = {
  code?: string;
  language?: string | number;
  languageId?: number;
  stdin?: string;
  testcases?: Array<{ input?: string; expectedOutput?: string; isHidden?: boolean }>;
  problem_id?: string;
  problemId?: string;
  functionName?: string;
  inputType?: string;
  outputType?: string;
  wait?: boolean;
};

const DEFAULT_RUN_RATE_LIMIT_PER_MIN = 600;

function parseRateLimitPerMinute(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(60, Math.min(5000, Math.floor(parsed)));
}

const RUN_RATE_LIMIT_PER_MIN = parseRateLimitPerMinute(
  process.env.JUDGE_RUN_RATE_LIMIT_PER_MIN,
  DEFAULT_RUN_RATE_LIMIT_PER_MIN
);

const JUDGE_SYNC_RUN_INLINE = String(process.env.JUDGE_SYNC_RUN_INLINE || "true").toLowerCase() !== "false";
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
      const row = (entry || {}) as { input?: unknown; expectedOutput?: unknown; output?: unknown; isHidden?: unknown };
      const input = String(row.input || "").trim();
      const expectedOutput = String(row.expectedOutput ?? row.output ?? "").trim();
      if (!input && !expectedOutput) return null;
      return {
        input,
        expectedOutput,
        isHidden: Boolean(row.isHidden ?? false),
      };
    })
    .filter((entry): entry is JudgeCase => entry !== null);
}

export async function POST(req: NextRequest) {
  try {
    const actor = buildRateLimitActor(req);
    const gate = await checkRateLimit({ key: `run:${actor}`, limit: RUN_RATE_LIMIT_PER_MIN, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `Too many run requests. Retry in ${gate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as RunBody;
    const code = String(body.code || "");
    if (!code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const language = resolveLanguage(body.language, body.languageId);
    if (!language) {
      return NextResponse.json(
        {
          error: "Unsupported language. Supported values: javascript, python, cpp, java (or matching runtime ids).",
        },
        { status: 400 }
      );
    }

    const requestedProblemId = String(body.problem_id || body.problemId || "").trim();
    const requestCases = normalizeCaseList(body.testcases);
    const wait = body.wait !== false;
    const submissionId = randomUUID();

    let jobData: JudgeJobData;

    if (requestedProblemId || requestCases.length > 0) {
      let effectiveCases = requestCases;
      let functionName = body.functionName;
      let inputType = body.inputType;
      let outputType = body.outputType;
      let source = "custom";

      if (requestedProblemId && effectiveCases.length === 0) {
        const loaded = await loadProblemCases(requestedProblemId);
        if (!loaded || loaded.cases.length === 0) {
          return NextResponse.json({ error: "No test cases found for this problem_id" }, { status: 404 });
        }

        effectiveCases = loaded.cases.filter((item) => !item.isHidden);
        functionName = functionName || loaded.functionName;
        inputType = inputType || loaded.inputType;
        outputType = outputType || loaded.outputType;
        source = loaded.source;
      }

      if (effectiveCases.length === 0) {
        effectiveCases = [{ input: "", expectedOutput: "", isHidden: false }];
      }

      jobData = {
        submissionId,
        kind: "question-evaluation",
        requestedAt: Date.now(),
        mode: "run",
        code,
        language,
        questionId: requestedProblemId || undefined,
        testcases: effectiveCases,
        functionName,
        inputType,
        outputType,
        caseSource: source,
      };
    } else {
      jobData = {
        submissionId,
        kind: "raw-run",
        requestedAt: Date.now(),
        code,
        language,
        stdin: String(body.stdin || ""),
      };
    }

    const respondInlineEvaluation = async (extraWarnings: string[] = []) => {
      try {
        await setSubmissionState(submissionId, "running");
      } catch {
        // Redis state tracking is best-effort for inline execution.
      }

      try {
        if (jobData.kind === "raw-run") {
          const raw = await evaluateRawRun(jobData);
          try {
            await setSubmissionState(submissionId, "completed", { data: raw });
          } catch {
            // Best-effort state persistence.
          }

          return NextResponse.json({
            submission_id: submissionId,
            output: raw.output,
            error: raw.error,
            compile_error: raw.compile_error,
            status: raw.status,
            execution_time_ms: raw.execution_time_ms,
            memory_kb: raw.memory_kb,
            language: raw.language,
            execution_mode: "inline-fast-path",
            warnings: extraWarnings,
          });
        }

        const questionPayload = await evaluateQuestion(jobData);
        try {
          await setSubmissionState(submissionId, "completed", { data: questionPayload });
        } catch {
          // Best-effort state persistence.
        }

        const total = typeof questionPayload.summary?.total === "number" ? questionPayload.summary.total : questionPayload.cases.length;
        const passed = typeof questionPayload.summary?.passed === "number"
          ? questionPayload.summary.passed
          : questionPayload.cases.filter((item) => item.passed).length;

        return NextResponse.json({
          submission_id: submissionId,
          passed,
          total,
          ...questionPayload,
          execution_mode: "inline-fast-path",
          warnings: [
            ...(Array.isArray(questionPayload.warnings) ? questionPayload.warnings : []),
            ...extraWarnings,
          ],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Execution failed";
        try {
          await setSubmissionState(submissionId, "failed", { error: message });
        } catch {
          // Best-effort state persistence.
        }
        throw error;
      }
    };

    if (JUDGE_SYNC_RUN_INLINE) {
      return respondInlineEvaluation([
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
        return respondInlineEvaluation(["Worker offline fallback: executed directly in API process."]);
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
        return respondInlineEvaluation([`Queue fallback: ${message}`]);
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
        execution_mode: "queued-worker",
      });
    }

    const envelope = await waitForSubmission(submissionId, { timeoutMs: 60_000, pollMs: 300 });
    if (!envelope) {
      return NextResponse.json(
        {
          submission_id: submissionId,
          state: "queued",
          execution_mode: "queued-worker",
          message: "Execution is still running. Poll GET /api/result/{submission_id}.",
        },
        { status: 202 }
      );
    }

    if (envelope.state === "failed") {
      return NextResponse.json(
        {
          submission_id: submissionId,
          error: envelope.error || "Execution failed",
        },
        { status: 500 }
      );
    }

    const payload = envelope.data;
    if (!payload) {
      return NextResponse.json({ submission_id: submissionId, error: "Missing execution payload" }, { status: 500 });
    }

    if (jobData.kind === "raw-run") {
      const raw = payload as RawRunPayload;
      return NextResponse.json({
        submission_id: submissionId,
        output: raw.output,
        error: raw.error,
        compile_error: raw.compile_error,
        status: raw.status,
        execution_time_ms: raw.execution_time_ms,
        memory_kb: raw.memory_kb,
        language: raw.language,
        execution_mode: "queued-worker",
      });
    }

    const questionPayload = payload as QuestionEvaluationPayload;
    const total = typeof questionPayload.summary?.total === "number" ? questionPayload.summary.total : questionPayload.cases.length;
    const passed = typeof questionPayload.summary?.passed === "number"
      ? questionPayload.summary.passed
      : questionPayload.cases.filter((item) => item.passed).length;

    return NextResponse.json({
      submission_id: submissionId,
      passed,
      total,
      ...questionPayload,
      execution_mode: "queued-worker",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
