import { Worker, Job } from 'bullmq';
import { config } from '@bot/config';
import pino from 'pino';
import { prisma } from '@bot/db';
import { postProductProcessor } from './processors/post-product.processor';
import { BrowserManager } from './bot/browser';
import Redis from 'ioredis';

const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});

const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'post-product',
  async (job: Job, token?: string) => {
    return postProductProcessor(job, logger, token);
  },
  {
    connection,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 1000, // 1 job per second max
    },
  }
);

const browserManager = BrowserManager.getInstance(logger);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down worker...');

  await worker.close();
  await browserManager.close();
  await connection.quit();

  logger.info('Worker shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message }, 'Worker error');
});

// Start browser
(async () => {
  try {
    await browserManager.initialize();
    logger.info('Worker started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start worker');
    process.exit(1);
  }
})();
