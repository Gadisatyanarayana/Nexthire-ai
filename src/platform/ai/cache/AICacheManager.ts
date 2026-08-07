import Redis from 'ioredis';
import { AILogger } from '../observability/AILogger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export type AICacheNamespace = 
  | 'resume-parse'
  | 'resume-intelligence'
  | 'ats'
  | 'jd-match'
  | 'cover-letter'
  | 'career-coach'
  | 'bullet-rewrite'
  | 'voice-context'
  | 'analytics';

export class AICacheManager {
  static async get<T>(namespace: AICacheNamespace, key: string): Promise<T | null> {
    const fullKey = `${namespace}:${key}`;
    try {
      const data = await redisClient.get(fullKey);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      AILogger.error(`Cache GET failed for ${fullKey}`, error, {
        provider: 'redis',
        model: 'cache',
        requestId: 'cache-get'
      });
      return null;
    }
  }

  static async set<T>(namespace: AICacheNamespace, key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    try {
      await redisClient.set(fullKey, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      AILogger.error(`Cache SET failed for ${fullKey}`, error, {
        provider: 'redis',
        model: 'cache',
        requestId: 'cache-set'
      });
    }
  }

  static async invalidate(namespace: AICacheNamespace, key: string): Promise<void> {
    const fullKey = `${namespace}:${key}`;
    try {
      await redisClient.del(fullKey);
    } catch (error) {
       AILogger.error(`Cache DEL failed for ${fullKey}`, error, {
        provider: 'redis',
        model: 'cache',
        requestId: 'cache-del'
      });
    }
  }
}
