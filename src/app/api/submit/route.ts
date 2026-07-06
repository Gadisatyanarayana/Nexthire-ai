
import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { evaluateQuestion } from "@/judge/evaluator";
import { resolveLanguage } from "@/judge/languages";
import { loadProblemCases, toMemoryLabel, toRuntimeLabel } from "@/judge/problemCases";
import { enqueueJudgeJob } from "@/judge/queue";
import { setSubmissionState, waitForSubmission } from "@/judge/resultStore";
import type { JudgeCase, JudgeJobData, QuestionEvaluationPayload } from "@/judge/types";
import { hasHealthyJudgeWorker } from "@/judge/workerHealth";

type SubmitBody = {
  problem_id?: string;
  code?: string;
  language_id?: number | string;
  wait?: boolean;
};

const MIN_VISIBLE_CASES = 2;
const MAX_VISIBLE_CASES = 3;
const MIN_HIDDEN_CASES = 20;
const MAX_HIDDEN_CASES = 20;
const DEFAULT_SUBMIT_RATE_LIMIT_PER_MIN = 300;

function parseRateLimitPerMinute(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(60, Math.min(5000, Math.floor(parsed)));
}

const SUBMIT_RATE_LIMIT_PER_MIN = parseRateLimitPerMinute(
  process.env.JUDGE_SUBMIT_RATE_LIMIT_PER_MIN,
  DEFAULT_SUBMIT_RATE_LIMIT_PER_MIN
);

const JUDGE_SYNC_SUBMIT_INLINE = String(process.env.JUDGE_SYNC_SUBMIT_INLINE || "true").toLowerCase() !== "false";
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

function normalizeSubmitCasePolicy(cases: JudgeCase[]): {
  effectiveCases: JudgeCase[];
  visibleCount: number;
  hiddenCount: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  let visible = cases.filter((item) => !item.isHidden).map((item) => ({ ...item, isHidden: false }));
  let hidden = cases.filter((item) => Boolean(item.isHidden)).map((item) => ({ ...item, isHidden: true }));

  if (visible.length > MAX_VISIBLE_CASES) {
    visible = visible.slice(0, MAX_VISIBLE_CASES);
    warnings.push("Visible test cases were trimmed to 3 for consistent run-mode parity.");
  }

  if (hidden.length > MAX_HIDDEN_CASES) {
    hidden = hidden.slice(0, MAX_HIDDEN_CASES);
    warnings.push("Hidden test cases were trimmed to 20 to match platform policy.");
  }

  const hiddenSeedPool = [...hidden, ...visible];
  let fillIndex = 0;
  while (hidden.length < MIN_HIDDEN_CASES && hiddenSeedPool.length > 0) {
    const source = hiddenSeedPool[fillIndex % hiddenSeedPool.length];
    hidden.push({
      input: String(source.input || ""),
      expectedOutput: String(source.expectedOutput || ""),
      isHidden: true,
    });
    fillIndex += 1;
  }

  if (hidden.length < MIN_HIDDEN_CASES) {
    warnings.push("Hidden test case pool is below 20. Regenerate problem testcases for full policy compliance.");
  }

  return {
    effectiveCases: [...visible, ...hidden],
    visibleCount: visible.length,
    hiddenCount: hidden.length,
    warnings,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest) {
  try {
    const actor = buildRateLimitActor(req);
    const gate = await checkRateLimit({ key: `submit:${actor}`, limit: SUBMIT_RATE_LIMIT_PER_MIN, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json(
        { error: `Too many submit requests. Retry in ${gate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SubmitBody;
    const problemId = String(body.problem_id || "").trim();
    const code = String(body.code || "");
    const language = resolveLanguage(body.language_id);
    const wait = body.wait !== false;

    if (!problemId) {
      return NextResponse.json({ error: "problem_id is required" }, { status: 400 });
    }

    if (!code.trim()) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    if (!language) {
      return NextResponse.json(
        { error: "Unsupported language_id. Supported ids are javascript=1, python=2, cpp=3, java=4." },
        { status: 400 }
      );
    }

    const loaded = await loadProblemCases(problemId);
    if (!loaded || loaded.cases.length === 0) {
      return NextResponse.json({ error: "No test cases found for this problem_id" }, { status: 404 });
    }

    if (loaded.visibleCount < MIN_VISIBLE_CASES) {
      return NextResponse.json(
        {
          error: "Problem test-case policy not satisfied. Each problem needs at least 2 visible test cases.",
          visible_count: loaded.visibleCount,
          hidden_count: loaded.hiddenCount,
        },
        { status: 422 }
      );
    }

    const policyWarnings: string[] = [];
    const normalizedPolicy = normalizeSubmitCasePolicy(loaded.cases);
    policyWarnings.push(...normalizedPolicy.warnings);

    if (normalizedPolicy.visibleCount < MIN_VISIBLE_CASES) {
      return NextResponse.json(
        {
          error: "Problem test-case policy not satisfied. Each problem needs at least 2 visible test cases.",
          visible_count: normalizedPolicy.visibleCount,
          hidden_count: normalizedPolicy.hiddenCount,
        },
        { status: 422 }
      );
    }

    const effectiveCases = normalizedPolicy.effectiveCases;

    const submissionId = randomUUID();
    const jobData: JudgeJobData = {
      submissionId,
      kind: "question-evaluation",
      requestedAt: Date.now(),
      mode: "submit",
      code,
      language,
      questionId: loaded.questionId || problemId,
      testcases: effectiveCases,
      functionName: loaded.functionName,
      inputType: loaded.inputType,
      outputType: loaded.outputType,
      caseSource: loaded.source,
    };

    let payload: QuestionEvaluationPayload | undefined;
    let executionMode: "inline-fast-path" | "queued-worker" = "queued-worker";
    const runInlineSubmission = async (extraWarnings: string[] = []): Promise<QuestionEvaluationPayload> => {
      try {
        await setSubmissionState(submissionId, "running");
      } catch {
        // Redis state tracking is best-effort for inline execution.
      }

      try {
        const inlineResult = await evaluateQuestion(jobData);
        const enrichedPayload: QuestionEvaluationPayload = {
          ...inlineResult,
          warnings: [
            ...(Array.isArray(inlineResult.warnings) ? inlineResult.warnings : []),
            ...extraWarnings,
          ],
        };

        try {
          await setSubmissionState(submissionId, "completed", { data: enrichedPayload });
        } catch {
          // Best-effort state persistence.
        }

        return enrichedPayload;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Submission failed";
        try {
          await setSubmissionState(submissionId, "failed", { error: message });
        } catch {
          // Best-effort state persistence.
        }
        throw error;
      }
    };

    if (JUDGE_SYNC_SUBMIT_INLINE) {
      executionMode = "inline-fast-path";
      payload = await runInlineSubmission([
        wait ? "Inline fast-path execution enabled." : "Inline fast-path execution enabled for submit mode.",
      ]);
    } else {
      if (wait) {
        const workerHealthy = await hasHealthyJudgeWorker();

        if (!workerHealthy) {
          if (JUDGE_REQUIRE_WORKER) {
            return NextResponse.json(
              { error: "Judge worker is offline. Start judge worker and retry." },
              { status: 503 }
            );
          }
          executionMode = "inline-fast-path";
          payload = await runInlineSubmission(["Worker offline fallback: executed directly in API process."]);
        } else {
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
            executionMode = "inline-fast-path";
            payload = await runInlineSubmission([`Queue fallback: ${message}`]);
          }
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

      if (!payload) {
        const envelope = await waitForSubmission(submissionId, { timeoutMs: 90_000, pollMs: 400 });
        if (!envelope) {
          return NextResponse.json(
            {
              submission_id: submissionId,
              state: "queued",
              execution_mode: "queued-worker",
              message: "Submission is still running. Poll GET /api/result/{submission_id}.",
            },
            { status: 202 }
          );
        }

        if (envelope.state === "failed") {
          return NextResponse.json({ error: envelope.error || "Submission failed" }, { status: 500 });
        }

        payload = envelope.data as QuestionEvaluationPayload | undefined;
        if (!payload) {
          return NextResponse.json({ error: "Missing submission payload" }, { status: 500 });
        }
      }
    }

    const caseResults = Array.isArray(payload.cases) ? payload.cases : [];
    const totalCount = caseResults.length;
    const passedCount = caseResults.filter((item) => item.passed).length;
    const normalizedStatus = payload.result ?? "Wrong Answer";
    const accepted = totalCount > 0 && passedCount === totalCount && normalizedStatus === "Accepted";
    const rawStatus = String(payload.result || "").trim();
    // Keep rawStatus for backward compatibility if needed
    // const normalizedStatus = accepted
    //   ? "Accepted"
    //   : (rawStatus.toLowerCase() === "accepted" ? "Wrong Answer" : (rawStatus || "Wrong Answer"));

    const firstFailedCase = caseResults.find((item) => !item.passed) || null;
    const failedInput = firstFailedCase
      ? firstFailedCase.isHidden
        ? "[Hidden Test Case]"
        : String(firstFailedCase.input || "")
      : null;
    const failedInputForResponse = normalizedStatus === "Wrong Answer" ? failedInput : null;

    const runtimeMs = typeof payload.executionStats?.avgTimeMs === "number" ? payload.executionStats.avgTimeMs : null;
    const memoryKb = typeof payload.executionStats?.avgMemoryKb === "number" ? payload.executionStats.avgMemoryKb : null;

    const responsePayload = {
      submission_id: submissionId,
      execution_mode: executionMode,
      result: normalizedStatus,
      status: normalizedStatus,
      passed: passedCount,
      total: totalCount,
      runtime: toRuntimeLabel(runtimeMs),
      memory: toMemoryLabel(memoryKb),
      failed_input: failedInputForResponse || undefined,
      runtime_ms: runtimeMs,
      memory_kb: memoryKb,
      problem_id: loaded.problemId,
      executionStats: payload.executionStats,
      assessment: payload.assessment,
      summary: payload.summary,
      cases: caseResults,
      diagnostics: payload.diagnostics || [],
      source: loaded.source,
      warnings: [...policyWarnings, ...(Array.isArray(payload.warnings) ? payload.warnings : [])],
    };

    try {
      const session = await getServerSession(authOptions);
      const userEmail = session?.user?.email;
      if (userEmail) {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({
          name: session.user?.name ?? null,
          email: String(userEmail).trim().toLowerCase(),
        });
        const submissionProblemId = isUuid(loaded.problemId) ? loaded.problemId : null;

        const fullPayload = {
          user_id: user.id,
          question_id: loaded.questionId || problemId,
          contest_id: null,
          language,
          code,
          output: normalizedStatus,
          result: normalizedStatus,
          runtime: toRuntimeLabel(runtimeMs),
          memory: toMemoryLabel(memoryKb),
          difficulty: loaded.difficulty ? String(loaded.difficulty).toLowerCase() : "unknown",
          passed_count: passedCount,
          total_count: totalCount,
          runtime_ms: runtimeMs,
          memory_kb: memoryKb,
          failed_input: failedInputForResponse,
          feedback: JSON.stringify({
            type: "self_hosted_submit",
            source: "api/submit",
            submission_id: submissionId,
            problem_id: loaded.problemId,
            case_summary: {
              status: normalizedStatus,
              passed: passedCount,
              total: totalCount,
              failed_input: failedInputForResponse,
            },
            executionStats: payload.executionStats || null,
            assessment: payload.assessment || null,
            diagnostics: payload.diagnostics || null,
          }),
        };

        const { error: fullError } = await admin.from("submissions").insert(fullPayload);
        if (fullError) {
          // Fallback to core base columns if database has not been fully migrated
          const basePayload = {
            user_id: user.id,
            question_id: loaded.questionId || problemId,
            contest_id: null,
            language,
            code,
            output: normalizedStatus,
            result: normalizedStatus,
            difficulty: loaded.difficulty ? String(loaded.difficulty).toLowerCase() : "unknown",
            feedback: JSON.stringify({
              type: "self_hosted_submit_fallback",
              source: "api/submit",
              submission_id: submissionId,
              problem_id: loaded.problemId,
              case_summary: {
                status: normalizedStatus,
                passed: passedCount,
                total: totalCount,
                failed_input: failedInputForResponse,
              },
              executionStats: payload.executionStats || null,
              assessment: payload.assessment || null,
              diagnostics: payload.diagnostics || null,
              runtime: toRuntimeLabel(runtimeMs),
              memory: toMemoryLabel(memoryKb),
            }),
          };
          await admin.from("submissions").insert(basePayload);
        }
      }
    } catch {
      // Persistence is best-effort and must not block submit responses.
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
