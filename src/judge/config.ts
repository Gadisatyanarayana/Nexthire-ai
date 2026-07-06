function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const JUDGE_QUEUE_NAME = process.env.JUDGE_QUEUE_NAME || "judge-submissions";

export const JUDGE_RESULT_TTL_SECONDS = clamp(
  toNumber(process.env.JUDGE_RESULT_TTL_SECONDS, 60 * 60 * 24),
  60,
  60 * 60 * 24 * 7
);

// Keep runtime limits tight for LeetCode-like fast evaluation.
export const EXECUTION_TIMEOUT_MS = clamp(
  toNumber(process.env.JUDGE_EXECUTION_TIMEOUT_MS, 20000),
  5000,
  60000
);

// Specific timeout for Java execution (fallback to generic if not set)
export const EXECUTION_TIMEOUT_JAVA_MS = EXECUTION_TIMEOUT_MS;

// Timeout for the compilation phase (applies to Java and other compiled languages)
export const EXECUTION_TIMEOUT_COMPILE_MS = clamp(
  toNumber(process.env.JUDGE_EXECUTION_TIMEOUT_COMPILE_MS, 50000),
  3000,
  60000
);

export const EXECUTION_MEMORY_MB = clamp(
  toNumber(process.env.JUDGE_EXECUTION_MEMORY_MB, 1024),
  64,
  2048
);

export const EXECUTION_CPU_LIMIT = clamp(
  toNumber(process.env.JUDGE_EXECUTION_CPU_LIMIT, 2),
  0.25,
  2
);

export const EXECUTION_PIDS_LIMIT = clamp(
  Math.floor(toNumber(process.env.JUDGE_EXECUTION_PIDS_LIMIT, 128)),
  32,
  1024
);

export const EXECUTION_OUTPUT_LIMIT_BYTES = clamp(
  Math.floor(toNumber(process.env.JUDGE_OUTPUT_LIMIT_BYTES, 64 * 1024)),
  8 * 1024,
  1024 * 1024
);

export const JUDGE_API_WAIT_TIMEOUT_MS = clamp(
  toNumber(process.env.JUDGE_API_WAIT_TIMEOUT_MS, 10_000),
  1_000,
  120_000
);

export const JUDGE_API_WAIT_POLL_MS = clamp(
  toNumber(process.env.JUDGE_API_WAIT_POLL_MS, 200),
  100,
  2_000
);

export const JUDGE_WORKER_CONCURRENCY = clamp(
  Math.floor(toNumber(process.env.JUDGE_WORKER_CONCURRENCY, 2)),
  1,
  32
);

export const JUDGE_WORKER_LOCK_DURATION_MS = clamp(
  Math.floor(toNumber(process.env.JUDGE_WORKER_LOCK_DURATION_MS, 300_000)),
  30_000,
  1_800_000
);

export const JUDGE_WORKER_LOCK_RENEW_MS = clamp(
  Math.floor(toNumber(process.env.JUDGE_WORKER_LOCK_RENEW_MS, 60_000)),
  5_000,
  300_000
);

export const JUDGE_WORKER_STALLED_INTERVAL_MS = clamp(
  Math.floor(toNumber(process.env.JUDGE_WORKER_STALLED_INTERVAL_MS, 60_000)),
  10_000,
  300_000
);

export const JUDGE_WORKER_MAX_STALLED_COUNT = clamp(
  Math.floor(toNumber(process.env.JUDGE_WORKER_MAX_STALLED_COUNT, 3)),
  1,
  10
);

export const JUDGE_JOB_ATTEMPTS = clamp(
  Math.floor(toNumber(process.env.JUDGE_JOB_ATTEMPTS, 2)),
  1,
  5
);

export const JUDGE_JOB_BACKOFF_MS = clamp(
  Math.floor(toNumber(process.env.JUDGE_JOB_BACKOFF_MS, 2_000)),
  250,
  60_000
);

export const JUDGE_MAX_PARALLEL_CONTAINERS = clamp(
  Math.floor(toNumber(process.env.JUDGE_MAX_PARALLEL_CONTAINERS, 2)),
  1,
  8
);

export const JUDGE_PREPULL_IMAGES = String(process.env.JUDGE_PREPULL_IMAGES || "false").toLowerCase() !== "false";
