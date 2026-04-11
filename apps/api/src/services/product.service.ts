import { Product } from '../schemas/product.schema';
import { PostJobData, QUEUE_NAME } from '@bot/utils/src/queue';

export class ProductService {
  /**
   * Validate product exists and is eligible for posting
   */
  static async validateProduct(
    id: string,
    db: any
  ): Promise<Product | null> {
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    // Check if eligible for posting (DRAFT or FAILED only)
    if (product.status === 'PROCESSING' || product.status === 'POSTED') {
      return null;
    }

    return product as Product;
  }

  /**
   * Update product status to PROCESSING
   */
  static async updateStatusToProcessing(
    id: string,
    db: any
  ): Promise<void> {
    await db.product.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });
  }

  /**
   * Create job record in database
   */
  static async createJobRecord(
    productId: string,
    db: any
  ): Promise<void> {
    await db.job.create({
      data: {
        productId,
        status: 'PENDING',
        attempt: 0,
      },
    });
  }

  /**
   * Update job record with status and log
   */
  static async updateJobRecord(
    jobId: string,
    status: string,
    db: any,
    log?: string
  ): Promise<void> {
    await db.job.updateMany({
      where: { id: jobId },
      data: {
        status,
        log,
      },
    });
  }

  /**
   * Post product to queue
   */
  static async postProduct(
    productId: string,
    queue: any,
    delay: number = 0
  ): Promise<string> {
    const jobData: PostJobData = {
      productId,
      attempt: 0,
    };

    const job = await queue.add(QUEUE_NAME, jobData, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
    });

    return job.id!;
  }

  /**
   * Batch post products to queue
   */
  static async batchPostProducts(
    productIds: string[],
    queue: any,
    delaySeconds: number = 300
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (let i = 0; i < productIds.length; i++) {
      const jobData: PostJobData = {
        productId: productIds[i],
        attempt: 0,
      };

      // Add staggered delay for each job
      const job = await queue.add(QUEUE_NAME, jobData, {
        delay: i * delaySeconds * 1000, // Convert to ms
        attempts: 3,
      });

      jobIds.push(job.id!);
    }

    return jobIds;
  }
}
