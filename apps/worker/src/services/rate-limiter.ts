import Redis from 'ioredis';
import { config } from '@bot/config';
import pino from 'pino';

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});

export class RateLimiter {
  private redis: Redis;
  private key: string;

  constructor() {
    this.redis = new Redis(config.redisUrl);
    const today = new Date().toISOString().split('T')[0];
    this.key = `posts:${today}`;
  }

  async canPostToday(): Promise<boolean> {
    try {
      const count = await this.redis.get(this.key);
      const currentCount = count ? parseInt(count, 10) : 0;

      if (currentCount >= config.maxPostPerDay) {
        logger.warn({ count: currentCount, limit: config.maxPostPerDay }, 'Daily post limit reached');
        return false;
      }

      // Warn if approaching limit (80%)
      if (currentCount >= config.maxPostPerDay * 0.8) {
        logger.warn(
          { count: currentCount, limit: config.maxPostPerDay },
          'Approaching daily post limit'
        );
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error checking rate limit');
      return false;
    }
  }

  async incrementPostCount(): Promise<void> {
    try {
      const count = await this.redis.incr(this.key);

      // Set expiry on first increment (24 hours)
      if (count === 1) {
        await this.redis.expire(this.key, 24 * 60 * 60);
      }

      logger.debug({ count, limit: config.maxPostPerDay }, 'Post count incremented');
    } catch (error) {
      logger.error({ error }, 'Error incrementing post count');
    }
  }

  async getPostCount(): Promise<number> {
    try {
      const count = await this.redis.get(this.key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error({ error }, 'Error getting post count');
      return 0;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
