import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Queue configuration
export const QUEUE_NAME = 'post_product';

export interface PostJobData {
  productId: string;
  attempt: number;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

/**
 * Create BullMQ queue connection
 */
export function createQueue(name: string, redisUrl: string): Queue {
  const connection = new IORedis(redisUrl);

  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30 seconds
      },
      removeOnComplete: {
        count: 1000,
        age: 24 * 60 * 60, // 24 hours
      },
      removeOnFail: {
        count: 5000,
        age: 7 * 24 * 60 * 60, // 7 days
      },
    },
  });
}

/**
 * Create BullMQ worker
 */
export function createWorker<T = unknown>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  redisUrl: string
): Worker {
  const connection = new IORedis(redisUrl);

  return new Worker(
    name,
    processor,
    {
      connection,
      concurrency: 1, // Process one job at a time
      limiter: {
        max: 1,
        duration: 5000, // 5 seconds
      },
    }
  );
}

export { Queue, Worker, Job };
