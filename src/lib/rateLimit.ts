type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const REDIS_RATE_LIMIT_TIMEOUT_MS = Math.max(
  500,
  Math.min(5000, Number(process.env.RATE_LIMIT_REDIS_TIMEOUT_MS || 1500))
);

function hasRedisRateLimitConfig() {
  return Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

function cleanup(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function checkRateLimitInMemory(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const current = buckets.get(config.key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(config.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, config.limit - 1),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(config.key, current);

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

async function checkRateLimitRedis(config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
  const bucketKey = `rl:${config.key}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REDIS_RATE_LIMIT_TIMEOUT_MS);

  const script = [
    "local current = redis.call('INCR', KEYS[1])",
    "if current == 1 then",
    "  redis.call('EXPIRE', KEYS[1], ARGV[1])",
    "end",
    "local ttl = redis.call('TTL', KEYS[1])",
    "return { current, ttl }",
  ].join("\n");

  let response: Response;
  try {
    response = await fetch(`${UPSTASH_REDIS_REST_URL}/eval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script,
        keys: [bucketKey],
        args: [String(windowSeconds)],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Redis limiter request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: [number | string, number | string];
  };
  const currentCount = Number(data.result?.[0] ?? 0);
  const ttlSeconds = Math.max(1, Number(data.result?.[1] ?? windowSeconds));
  const resetAt = now + ttlSeconds * 1000;

  if (currentCount > config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterSeconds: ttlSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - currentCount),
    resetAt,
    retryAfterSeconds: 0,
  };
}

export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  if (!hasRedisRateLimitConfig()) {
    return checkRateLimitInMemory(config);
  }

  try {
    return await checkRateLimitRedis(config);
  } catch {
    return checkRateLimitInMemory(config);
  }
}
