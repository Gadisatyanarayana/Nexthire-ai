import { JUDGE_API_WAIT_POLL_MS, JUDGE_API_WAIT_TIMEOUT_MS, JUDGE_RESULT_TTL_SECONDS } from "./config";
import { getRedisConnection } from "./redis";
import type { SubmissionEnvelope, SubmissionState } from "./types";

type MemoryEnvelope = {
  value: SubmissionEnvelope;
  expiresAt: number;
};

declare global {
  var __judgeResultMemoryStore: Map<string, MemoryEnvelope> | undefined;
}

function resultKey(submissionId: string): string {
  return `judge:result:${submissionId}`;
}

function getMemoryStore(): Map<string, MemoryEnvelope> {
  if (!globalThis.__judgeResultMemoryStore) {
    globalThis.__judgeResultMemoryStore = new Map<string, MemoryEnvelope>();
  }
  return globalThis.__judgeResultMemoryStore;
}

function setMemoryEnvelope(submissionId: string, envelope: SubmissionEnvelope): void {
  const store = getMemoryStore();
  store.set(resultKey(submissionId), {
    value: envelope,
    expiresAt: Date.now() + JUDGE_RESULT_TTL_SECONDS * 1000,
  });
}

function getMemoryEnvelope(submissionId: string): SubmissionEnvelope | null {
  const store = getMemoryStore();
  const key = resultKey(submissionId);
  const record = store.get(key);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }

  return record.value;
}

export async function setSubmissionEnvelope(
  submissionId: string,
  envelope: Omit<SubmissionEnvelope, "submissionId" | "updatedAt"> & { updatedAt?: number }
): Promise<void> {
  const payload: SubmissionEnvelope = {
    submissionId,
    state: envelope.state,
    updatedAt: envelope.updatedAt || Date.now(),
    data: envelope.data,
    error: envelope.error,
  };

  setMemoryEnvelope(submissionId, payload);

  try {
    const redis = getRedisConnection();
    if (redis.status === "ready") {
      await redis.set(resultKey(submissionId), JSON.stringify(payload), "EX", JUDGE_RESULT_TTL_SECONDS);
    }
  } catch {
    // Memory fallback is already persisted above.
  }
}

export async function setSubmissionState(
  submissionId: string,
  state: SubmissionState,
  options?: {
    data?: SubmissionEnvelope["data"];
    error?: string;
  }
): Promise<void> {
  await setSubmissionEnvelope(submissionId, {
    state,
    data: options?.data,
    error: options?.error,
  });
}

export async function getSubmissionEnvelope(submissionId: string): Promise<SubmissionEnvelope | null> {
  try {
    const redis = getRedisConnection();
    if (redis.status === "ready") {
      const raw = await redis.get(resultKey(submissionId));
      if (raw) {
        const parsed = JSON.parse(raw) as SubmissionEnvelope;
        setMemoryEnvelope(submissionId, parsed);
        return parsed;
      }
    }
    return getMemoryEnvelope(submissionId);
  } catch {
    return getMemoryEnvelope(submissionId);
  }
}

export async function waitForSubmission(
  submissionId: string,
  options?: {
    timeoutMs?: number;
    pollMs?: number;
  }
): Promise<SubmissionEnvelope | null> {
  const timeoutMs = options?.timeoutMs ?? JUDGE_API_WAIT_TIMEOUT_MS;
  const pollMs = options?.pollMs ?? JUDGE_API_WAIT_POLL_MS;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const envelope = await getSubmissionEnvelope(submissionId);
    if (envelope && (envelope.state === "completed" || envelope.state === "failed")) {
      return envelope;
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  return null;
}
