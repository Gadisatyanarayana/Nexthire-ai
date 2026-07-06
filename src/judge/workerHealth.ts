import { getRedisConnection } from "./redis";

const JUDGE_WORKER_HEARTBEAT_KEY = "judge:worker:heartbeat";
const JUDGE_WORKER_HEARTBEAT_TTL_SECONDS = 15;

export async function publishWorkerHeartbeat(metadata?: { pid?: number; queue?: string }): Promise<void> {
  try {
    const redis = getRedisConnection();
    if (redis.status === "ready") {
      await redis.set(
        JUDGE_WORKER_HEARTBEAT_KEY,
        JSON.stringify({
          at: Date.now(),
          pid: metadata?.pid || process.pid,
          queue: metadata?.queue,
        }),
        "EX",
        JUDGE_WORKER_HEARTBEAT_TTL_SECONDS
      );
    }
  } catch {
    // Ignore heartbeat write errors
  }
}

export async function hasHealthyJudgeWorker(): Promise<boolean> {
  try {
    const redis = getRedisConnection();
    if (redis.status !== "ready") {
      return false;
    }
    const heartbeat = await redis.get(JUDGE_WORKER_HEARTBEAT_KEY);
    return Boolean(heartbeat);
  } catch {
    return false;
  }
}
