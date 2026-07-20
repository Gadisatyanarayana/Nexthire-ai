import { checkRateLimit } from '@/lib/rateLimit';

export type IntegrationQuota = {
  burstPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  maxPayloadBytes: number;
  concurrentRequests: number;
};

export const DEFAULT_ENTERPRISE_QUOTA: IntegrationQuota = {
  burstPerMinute: 100,
  requestsPerHour: 5000,
  requestsPerDay: 100000,
  maxPayloadBytes: 1048576, // 1MB
  concurrentRequests: 10,
};

export class IntegrationRateLimitService {
  /**
   * Checks all tiers of the rate limit quotas. 
   * Returns allowed: false if ANY quota is exceeded.
   */
  public static async checkQuotas(
    tenantId: string, 
    keyId: string, 
    quota: IntegrationQuota = DEFAULT_ENTERPRISE_QUOTA
  ) {
    const limits = [
      { key: `int:burst:${tenantId}:${keyId}`, limit: quota.burstPerMinute, windowMs: 60 * 1000 },
      { key: `int:hourly:${tenantId}:${keyId}`, limit: quota.requestsPerHour, windowMs: 60 * 60 * 1000 },
      { key: `int:daily:${tenantId}:${keyId}`, limit: quota.requestsPerDay, windowMs: 24 * 60 * 60 * 1000 }
    ];

    let mostRestrictiveRetry = 0;
    
    // We check all limits to properly increment the buckets, but if one fails, the request fails.
    const results = await Promise.all(
      limits.map(limit => checkRateLimit(limit))
    );

    for (const res of results) {
      if (!res.allowed) {
        mostRestrictiveRetry = Math.max(mostRestrictiveRetry, res.retryAfterSeconds);
      }
    }

    if (mostRestrictiveRetry > 0) {
      return { allowed: false, retryAfterSeconds: mostRestrictiveRetry };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }
}
