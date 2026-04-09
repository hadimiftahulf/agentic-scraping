import { Router } from 'express';
import { prisma } from '@bot/db';
import Redis from 'ioredis';
import { createLogger } from 'pino';

const router = Router();
const logger = createLogger();

// Get Redis instance
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    redis: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    queue?: { status: 'ok' | 'error'; pendingJobs?: number; error?: string };
  };
  uptime: number;
  version: string;
  timestamp: string;
}

// Basic health check
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ok' });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(503).json({ status: 'error', message: 'Service unavailable' });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const startTime = process.hrtime();
  const health: HealthCheck = {
    status: 'healthy',
    checks: {
      database: { status: 'ok' },
      redis: { status: 'ok' },
      queue: { status: 'ok', pendingJobs: 0 },
    },
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  };

  let hasError = false;

  // Check database
  try {
    const dbStart = process.hrtime();
    await prisma.$queryRaw`SELECT 1`;
    const dbEnd = process.hrtime(dbStart);
    const dbLatency = dbEnd[0] * 1000 + dbEnd[1] / 1000000;
    health.checks.database = { status: 'ok', latencyMs: Math.round(dbLatency) };
  } catch (error) {
    hasError = true;
    health.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({ error }, 'Database health check failed');
  }

  // Check Redis
  try {
    const redisStart = process.hrtime();
    await redis.ping();
    const redisEnd = process.hrtime(redisStart);
    const redisLatency = redisEnd[0] * 1000 + redisEnd[1] / 1000000;
    health.checks.redis = { status: 'ok', latencyMs: Math.round(redisLatency) };
  } catch (error) {
    hasError = true;
    health.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({ error }, 'Redis health check failed');
  }

  // Check queue (pending jobs)
  try {
    const pendingJobs = await redis.llen('bull:post-product:wait');
    health.checks.queue = {
      status: 'ok',
      pendingJobs,
    };
  } catch (error) {
    hasError = true;
    health.checks.queue = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({ error }, 'Queue health check failed');
  }

  // Set overall status
  if (hasError) {
    health.status = 'unhealthy';
  }

  const statusCode = hasError ? 503 : 200;
  res.status(statusCode).json(health);
});

export default router;
