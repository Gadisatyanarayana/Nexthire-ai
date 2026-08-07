import Redis from 'ioredis';
import { AILogger } from '../observability/AILogger';

const redisUrl = process.env.REDIS_URL;
export const redisClient = redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}) : null;

// Fallback Memory Cache for Vercel Hobby / Local without Redis
const memoryCache = new Map<string, { value: string, expiry: number }>();

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
      if (redisClient) {
        const data = await redisClient.get(fullKey);
        if (data) return JSON.parse(data) as T;
      } else {
        const cached = memoryCache.get(fullKey);
        if (cached && cached.expiry > Date.now()) {
          return JSON.parse(cached.value) as T;
        } else if (cached) {
          memoryCache.delete(fullKey);
        }
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
      if (redisClient) {
        await redisClient.set(fullKey, JSON.stringify(value), 'EX', ttlSeconds);
      } else {
        memoryCache.set(fullKey, { 
          value: JSON.stringify(value), 
          expiry: Date.now() + (ttlSeconds * 1000) 
        });
      }
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
      if (redisClient) {
        await redisClient.del(fullKey);
      } else {
        memoryCache.delete(fullKey);
      }
    } catch (error) {
       AILogger.error(`Cache DEL failed for ${fullKey}`, error, {
        provider: 'redis',
        model: 'cache',
        requestId: 'cache-del'
      });
    }
  }
}
