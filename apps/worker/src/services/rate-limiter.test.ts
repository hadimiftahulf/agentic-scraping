import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Redis from 'ioredis';
import { RateLimiter } from './rate-limiter';

// Define mock outside so it can be accessed in factory
const mockRedis = {
  get: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  quit: vi.fn(),
};

vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis),
}));

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('@bot/config', () => ({
  config: {
    redisUrl: 'redis://localhost:6379',
    maxPostPerDay: 8,
    nodeEnv: 'test',
  },
}));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter = new RateLimiter();
    // Inject mockRedis because vi.mock has closure issues
    (rateLimiter as any).redis = mockRedis;
  });

  afterEach(async () => {
    if (rateLimiter) {
      await rateLimiter.close();
    }
  });

  describe('canPostToday', () => {
    it('should return true when no posts have been made today', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await rateLimiter.canPostToday();

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalled();
    });

    it('should return true when under the limit', async () => {
      mockRedis.get.mockResolvedValue('3');

      const result = await rateLimiter.canPostToday();

      expect(result).toBe(true);
    });

    it('should return false when limit is reached', async () => {
      mockRedis.get.mockResolvedValue('8');

      const result = await rateLimiter.canPostToday();

      expect(result).toBe(false);
    });

    it('should warn when approaching limit', async () => {
      mockRedis.get.mockResolvedValue('7');

      const result = await rateLimiter.canPostToday();

      expect(result).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await rateLimiter.canPostToday();

      expect(result).toBe(false);
    });
  });

  describe('incrementPostCount', () => {
    it('should increment post counter', async () => {
      mockRedis.incr.mockResolvedValue(1);

      await rateLimiter.incrementPostCount();

      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('should set expiry on first increment', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      await rateLimiter.incrementPostCount();

      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), 24 * 60 * 60);
    });

    it('should not set expiry on subsequent increments', async () => {
      mockRedis.incr.mockResolvedValue(2);

      await rateLimiter.incrementPostCount();

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.incr.mockRejectedValue(new Error('Redis error'));

      await expect(rateLimiter.incrementPostCount()).resolves.not.toThrow();
    });
  });

  describe('getPostCount', () => {
    it('should return current post count', async () => {
      mockRedis.get.mockResolvedValue('5');

      const count = await rateLimiter.getPostCount();

      expect(count).toBe(5);
    });

    it('should return 0 when no posts have been made', async () => {
      mockRedis.get.mockResolvedValue(null);

      const count = await rateLimiter.getPostCount();

      expect(count).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const count = await rateLimiter.getPostCount();

      expect(count).toBe(0);
    });
  });
});
