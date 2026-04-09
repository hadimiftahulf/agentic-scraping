import { Queue } from '@bot/utils/src/queue';
import config from '@bot/config';

export class QueueService {
  private queue: Queue | null = null;

  /**
   * Initialize queue connection
   */
  async initialize(redisClient: any): Promise<void> {
    if (this.queue) {
      return;
    }

    this.queue = new Queue('post_product', {
      connection: redisClient,
    });
  }

  /**
   * Get queue instance
   */
  getQueue(): Queue {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }
    return this.queue;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    if (!this.queue) {
      throw new Error('Queue not initialized');
    }

    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed'
    );

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    };
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
    }
  }
}
