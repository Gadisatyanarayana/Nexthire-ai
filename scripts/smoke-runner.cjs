process.env.TS_NODE_PROJECT = "tsconfig.worker.json";
require("ts-node/register/transpile-only");
const fs = require("fs");
const net = require("net");

const { randomUUID } = require("crypto");
const { evaluateQuestion } = require("../src/judge/evaluator");

function writeResult(payload) {
  fs.writeFileSync("tmp_smoke_result.json", JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload));
}

function resolveRedisEndpoint() {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname || "127.0.0.1",
        port: Number(parsed.port || 6379),
      };
    } catch {
      // Fall through to host/port env vars.
    }
  }

  return {
    host: String(process.env.REDIS_HOST || "127.0.0.1"),
    port: Number(process.env.REDIS_PORT || 6379),
  };
}

function probeRedis(timeoutMs = 700) {
  const endpoint = resolveRedisEndpoint();

  return new Promise((resolve) => {
    const socket = net.createConnection({ host: endpoint.host, port: endpoint.port });
    let done = false;

    const finish = (ok) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function toResultMeta(result) {
  const normalized = String(result || "");
  const error = normalized === "Compile Error"
    ? "Compilation failed"
    : normalized === "Runtime Error"
    ? "Runtime execution failed"
    : normalized === "Time Limit Exceeded"
    ? "Execution timed out"
    : "";

  return {
    status: normalized === "Accepted" ? "success" : normalized === "Time Limit Exceeded" ? "timeout" : "error",
    output: `result=${normalized || "Unknown"}`,
    error,
  };
}

async function runDirectEvaluation(jobData, started, queueStateLabel) {
  const payload = await evaluateQuestion(jobData);
  const elapsedMs = Date.now() - started;
  const meta = toResultMeta(payload && payload.result ? payload.result : "Unknown");

  writeResult({
    status: meta.status,
    output: meta.output,
    error: meta.error,
    elapsedMs,
    submissionId: jobData.submissionId,
    queueState: queueStateLabel,
  });

  process.exit(meta.status === "success" ? 0 : 1);
}

(async () => {
  const submissionId = randomUUID();
  const started = Date.now();

  console.log(`[smoke-runner] container start submissionId=${submissionId}`);

  const jobData = {
    submissionId,
    kind: "question-evaluation",
    requestedAt: Date.now(),
    mode: "submit",
    code: "class Solution:\n    def add(self, a, b):\n        return a + b",
    language: "python",
    questionId: "tmp-q",
    testcases: [
      { input: "1,2", expectedOutput: "3", isHidden: false },
      { input: "5,7", expectedOutput: "12", isHidden: true }
    ],
    functionName: "add",
    inputType: "int,int",
    outputType: "int",
    caseSource: "smoke"
  };

  const redisReachable = await probeRedis();
  if (!redisReachable) {
    console.warn("[smoke-runner] redis unreachable, direct fallback");
    await runDirectEvaluation(jobData, started, "redis-offline-direct-inline");
  }

  const { enqueueJudgeJob } = require("../src/judge/queue");
  const { setSubmissionState, waitForSubmission } = require("../src/judge/resultStore");

  let envelope = null;

  try {
    await setSubmissionState(submissionId, "queued");
    await enqueueJudgeJob(jobData);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.warn(`[smoke-runner] queue unavailable, direct fallback: ${message}`);
    await runDirectEvaluation(jobData, started, "direct-inline");
  }

  console.log(`[smoke-runner] execution start submissionId=${submissionId}`);

  try {
    envelope = await waitForSubmission(submissionId, { timeoutMs: 30000, pollMs: 250 });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.warn(`[smoke-runner] queue read failed, direct fallback: ${message}`);
    await runDirectEvaluation(jobData, started, "direct-inline");
  }

  const elapsedMs = Date.now() - started;

  if (!envelope) {
    console.warn("[smoke-runner] queue timed out, direct fallback");
    await runDirectEvaluation(jobData, started, "queue-timeout-direct-inline");
  }

  if (envelope.state === "failed") {
    writeResult({
      status: "error",
      output: "",
      error: envelope.error || "Job failed without explicit error",
      elapsedMs,
      submissionId,
      queueState: envelope.state
    });
    process.exit(1);
  }

  const result = envelope && envelope.data && envelope.data.result ? String(envelope.data.result) : "Unknown";
  const meta = toResultMeta(result);
  console.log(`[smoke-runner] execution end submissionId=${submissionId} result=${result}`);
  writeResult({
    status: meta.status,
    output: meta.output,
    error: meta.error,
    elapsedMs,
    submissionId,
    queueState: envelope.state
  });
  process.exit(0);
})().catch((error) => {
  const payload = {
    status: "error",
    output: "",
    error: error && error.message ? error.message : String(error),
    elapsedMs: 0,
  };
  writeResult(payload);
  process.exit(1);
});
