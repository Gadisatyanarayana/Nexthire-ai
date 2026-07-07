import IORedis from "ioredis";

declare global {
   
  var __appRedisClient: IORedis | undefined;
}

function buildRedisClient(): IORedis | null {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  const redisHost = String(process.env.REDIS_HOST || "").trim();
  const redisPort = Number(process.env.REDIS_PORT || 6379);
  const redisPassword = String(process.env.REDIS_PASSWORD || "").trim();

  if (!redisUrl && !redisHost && !redisPassword) {
    return null;
  }

  const commonOptions = {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 1000,
    commandTimeout: 1000,
  } as const;

  const client = redisUrl
    ? new IORedis(redisUrl, commonOptions)
    : new IORedis({
        host: redisHost || "127.0.0.1",
        port: Number.isFinite(redisPort) ? redisPort : 6379,
        password: redisPassword || undefined,
        ...commonOptions,
      });

  client.on("error", () => {
    // Intentionally silent. Cache must never break the app.
  });

  return client;
}

export function getAppRedisClient(): IORedis | null {
  if (!globalThis.__appRedisClient) {
    globalThis.__appRedisClient = buildRedisClient() ?? undefined;
  }

  return globalThis.__appRedisClient || null;
}

export function getCacheTtlSeconds(defaultSeconds: number): number {
  const raw = Number(process.env.APP_CACHE_TTL_SECONDS || defaultSeconds);
  if (!Number.isFinite(raw)) return Math.max(1, Math.floor(defaultSeconds));
  return Math.max(1, Math.floor(raw));
}

export async function readJsonCache<T>(key: string): Promise<T | null> {
  try {
    const client = getAppRedisClient();
    if (!client) return null;

    const raw = await client.get(key);
    if (!raw) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const client = getAppRedisClient();
    if (!client) return;

    await client.set(key, JSON.stringify(value), "EX", Math.max(1, Math.floor(ttlSeconds)));
  } catch {
    // Cache writes are best effort.
  }
}

export async function deleteCachedKeys(keys: string[]): Promise<void> {
  try {
    const client = getAppRedisClient();
    if (!client || keys.length === 0) return;

    await client.del(...keys);
  } catch {
    // Cache invalidation is best effort.
  }
}
