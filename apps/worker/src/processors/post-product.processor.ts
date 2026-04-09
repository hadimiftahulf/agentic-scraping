import { Job } from 'bullmq';
import { pino } from 'pino';
import { BrowserManager } from '../bot/browser';
import { FBPoster } from '../bot/fb-poster';
import { RateLimiter } from '../services/rate-limiter';
import { CaptchaHandler } from '../bot/captcha-handler';
import { prisma } from '@bot/db';

export interface PostProductJobData {
  productId: string;
}

export interface PostProductJobResult {
  success: boolean;
  listingUrl?: string;
  error?: string;
}

export async function postProductProcessor(
  job: Job<PostProductJobData>,
  logger: pino.BaseLogger
): Promise<PostProductJobResult> {
  const { productId } = job.data;

  logger.info({ productId }, 'Processing post-product job');

  // Check daily rate limit
  const rateLimiter = new RateLimiter();
  const canPost = await rateLimiter.canPostToday();

  if (!canPost) {
    logger.warn('Daily post limit reached, rescheduling job');
    // Schedule for tomorrow at 8 AM
    const tomorrow8AM = new Date();
    tomorrow8AM.setDate(tomorrow8AM.getDate() + 1);
    tomorrow8AM.setHours(8, 0, 0, 0);
    await job.moveToDelayed(Date.parse(tomorrow8AM.toISOString()), {
      delay: Date.parse(tomorrow8AM.toISOString()) - Date.now(),
    });
    return { success: false, error: 'Daily limit reached' };
  }

  // Get product from database
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    logger.error({ productId }, 'Product not found');
    return { success: false, error: 'Product not found' };
  }

  // Check if product has local image
  if (!product.imageLocal) {
    logger.error({ productId }, 'Product has no local image');
    return { success: false, error: 'Product has no local image' };
  }

  // Update product status to PROCESSING
  await prisma.product.update({
    where: { id: productId },
    data: { status: 'PROCESSING' },
  });

  try {
    // Get browser instance
    const browserManager = BrowserManager.getInstance();
    const context = await browserManager.getContext();

    // Create page for captcha check
    const page = await context.newPage();

    // Check for captcha before starting
    const captchaHandler = new CaptchaHandler(logger);
    const captchaResult = await captchaHandler.checkAndHandle(page, job.id);
    if (!captchaResult) {
      await page.close();
      throw new Error('Captcha detected and could not be resolved');
    }
    await page.close();

    // Post product to Facebook Marketplace
    const fbPoster = new FBPoster(context, logger);
    const result = await fbPoster.post(product);

    if (result.success) {
      // Update product status to POSTED
      await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
        },
      });

      // Log success to Job table
      await prisma.job.create({
        data: {
          productId,
          status: 'POSTED',
          log: `Successfully posted. Listing URL: ${result.listingUrl}`,
          attempt: job.attemptsMade + 1,
        },
      });

      // Increment post counter
      await rateLimiter.incrementPostCount();

      logger.info({ productId, listingUrl: result.listingUrl }, 'Product posted successfully');
      return result;
    } else {
      // Update product status to FAILED
      await prisma.product.update({
        where: { id: productId },
        data: { status: 'FAILED' },
      });

      // Log failure to Job table
      await prisma.job.create({
        data: {
          productId,
          status: 'FAILED',
          log: result.error || 'Unknown error',
          attempt: job.attemptsMade + 1,
        },
      });

      logger.error({ productId, error: result.error }, 'Failed to post product');
      return result;
    }
  } catch (error) {
    // Log error to Job table
    await prisma.job.create({
      data: {
        productId,
        status: 'FAILED',
        log: error instanceof Error ? error.message : 'Unknown error',
        attempt: job.attemptsMade + 1,
      },
    });

    logger.error({ productId, error }, 'Error in post-product processor');
    throw error; // Let BullMQ handle retry
  }
}
