import { Queue } from "bullmq";

import { JUDGE_JOB_ATTEMPTS, JUDGE_JOB_BACKOFF_MS, JUDGE_QUEUE_NAME } from "./config";
import { getRedisConnection } from "./redis";
import type { JudgeJobData } from "./types";

declare global {
  var __judgeQueue: Queue<JudgeJobData> | undefined;
}

export function getJudgeQueue(): Queue<JudgeJobData> {
  if (!globalThis.__judgeQueue) {
    globalThis.__judgeQueue = new Queue<JudgeJobData>(JUDGE_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: JUDGE_JOB_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: JUDGE_JOB_BACKOFF_MS,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
  }

  return globalThis.__judgeQueue;
}

export async function enqueueJudgeJob(payload: JudgeJobData): Promise<void> {
  const queue = getJudgeQueue();

  await queue.add("submission", payload, {
    jobId: payload.submissionId,
    attempts: JUDGE_JOB_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: JUDGE_JOB_BACKOFF_MS,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  });
}
