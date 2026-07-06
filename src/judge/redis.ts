import IORedis from "ioredis";

declare global {
  var __judgeRedisClient: IORedis | undefined;
}

function buildRedisClient(): IORedis {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  const commonOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  } as const;

  const client = redisUrl
    ? new IORedis(redisUrl, commonOptions)
    : new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number.isFinite(Number(process.env.REDIS_PORT || 6379)) ? Number(process.env.REDIS_PORT || 6379) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...commonOptions,
    });

  // Prevent Node "Unhandled error event" spam when Redis is intentionally offline in inline judge mode.
  client.on("error", () => {
    // No-op by design.
  });

  return client;
}

export function getRedisConnection(): IORedis {
  if (!globalThis.__judgeRedisClient) {
    globalThis.__judgeRedisClient = buildRedisClient();
  }
  return globalThis.__judgeRedisClient;
}
