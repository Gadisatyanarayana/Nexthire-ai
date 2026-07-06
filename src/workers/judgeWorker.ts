import { Worker } from "bullmq";

import {
  JUDGE_QUEUE_NAME,
  JUDGE_WORKER_CONCURRENCY,
  JUDGE_WORKER_LOCK_DURATION_MS,
  JUDGE_WORKER_LOCK_RENEW_MS,
  JUDGE_WORKER_MAX_STALLED_COUNT,
  JUDGE_WORKER_STALLED_INTERVAL_MS,
} from "../judge/config";
import { prepullSandboxImages, prewarmSandboxImages } from "../judge/dockerExecutor";
import { evaluateQuestion, evaluateRawRun } from "../judge/evaluator";
import { getRedisConnection } from "../judge/redis";
import { setSubmissionState } from "../judge/resultStore";
import type { JudgeJobData } from "../judge/types";
import { publishWorkerHeartbeat } from "../judge/workerHealth";

let heartbeatTimer: NodeJS.Timeout | null = null;

async function processJob(data: JudgeJobData) {
  await setSubmissionState(data.submissionId, "running");

  if (data.kind === "raw-run") {
    const result = await evaluateRawRun(data);
    await setSubmissionState(data.submissionId, "completed", { data: result });
    return;
  }

  const result = await evaluateQuestion(data);
  await setSubmissionState(data.submissionId, "completed", { data: result });
}

const worker = new Worker<JudgeJobData>(
  JUDGE_QUEUE_NAME,
  async (job) => {
    try {
      await processJob(job.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Execution failed";
      await setSubmissionState(job.data.submissionId, "failed", { error: message });
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: JUDGE_WORKER_CONCURRENCY,
    // Keep lock renewal conservative for slow sandbox startups.
    lockDuration: JUDGE_WORKER_LOCK_DURATION_MS,
    lockRenewTime: JUDGE_WORKER_LOCK_RENEW_MS,
    stalledInterval: JUDGE_WORKER_STALLED_INTERVAL_MS,
    maxStalledCount: JUDGE_WORKER_MAX_STALLED_COUNT,
  }
);

worker.on("ready", () => {
  console.log(`[judge-worker] ready on queue ${JUDGE_QUEUE_NAME} with concurrency ${JUDGE_WORKER_CONCURRENCY}`);

  const heartbeat = () => publishWorkerHeartbeat({ queue: JUDGE_QUEUE_NAME }).catch(() => undefined);
  void heartbeat();
  heartbeatTimer = setInterval(() => {
    void heartbeat();
  }, 5000);

  // Best-effort image warm-up to reduce first-job cold starts.
  void prepullSandboxImages();
  void prewarmSandboxImages();
});

worker.on("active", (job) => {
  console.log(`[judge-worker] active job=${job.id} submission=${job.data.submissionId} kind=${job.data.kind}`);
});

worker.on("stalled", (jobIdOrJob: unknown) => {
  const jobId = typeof jobIdOrJob === "string" ? jobIdOrJob : (jobIdOrJob as any)?.id;
  const submissionId = typeof jobIdOrJob === "string" ? "unknown" : (jobIdOrJob as any)?.data?.submissionId;
  console.warn(`[judge-worker] stalled job=${jobId || "unknown"} submission=${submissionId || "unknown"}`);
});

worker.on("completed", (job) => {
  console.log(`[judge-worker] completed job=${job.id} submission=${job.data.submissionId}`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[judge-worker] job failed job=${job?.id || "unknown"} submission=${job?.data?.submissionId || "unknown"}:`,
    err
  );
});

worker.on("error", (err) => {
  console.error("[judge-worker] worker error:", err);
});

async function shutdown(signal: string) {
  console.log(`[judge-worker] received ${signal}, shutting down`);
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  console.error("[judge-worker] unhandledRejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[judge-worker] uncaughtException:", error);
});
