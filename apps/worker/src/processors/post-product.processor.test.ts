import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Job } from 'bullmq';
import { postProductProcessor } from './post-product.processor';
import { BrowserManager } from '../bot/browser';
import { FBPoster } from '../bot/fb-poster';
import { RateLimiter } from '../services/rate-limiter';
import { CaptchaHandler } from '../bot/captcha-handler';
import { prisma } from '@bot/db';

describe('post-product.processor', () => {
  let mockJob: Job;
  let mockLogger: any;
  let mockProduct: any;

  beforeEach(() => {
    // Mock dependencies
    vi.mock('../bot/browser');
    vi.mock('../bot/fb-poster');
    vi.mock('../services/rate-limiter');
    vi.mock('../bot/captcha-handler');
    vi.mock('@bot/db');

    mockJob = {
      id: 'test-job-id',
      data: { productId: 'test-product-id' },
      attemptsMade: 0,
      moveToDelayed: vi.fn(),
    } as any;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockProduct = {
      id: 'test-product-id',
      title: 'Test Product',
      price: 1000000,
      description: 'Test description',
      imageLocal: '/path/to/image.jpg',
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.product.update).mockResolvedValue(mockProduct);
    vi.mocked(prisma.job.create).mockResolvedValue({} as any);
  });

  describe('daily rate limiting', () => {
    it('should reschedule job when daily limit is reached', async () => {
      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(false),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Daily limit reached');
      expect(mockJob.moveToDelayed).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Daily post limit reached, rescheduling job'
      );
    });

    it('should proceed when under daily limit', async () => {
      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(true),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      vi.mocked(BrowserManager.getInstance).mockReturnValue({
        getContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            close: vi.fn(),
          }),
        }),
      } as any);

      vi.mocked(CaptchaHandler).mockImplementation(() => ({
        checkAndHandle: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(FBPoster).mockImplementation(() => ({
        post: vi.fn().mockResolvedValue({
          success: true,
          listingUrl: 'https://facebook.com/marketplace/item/123',
        }),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(true);
    });
  });

  describe('product validation', () => {
    it('should fail when product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(true),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
      expect(mockLogger.error).toHaveBeenCalledWith(
        { productId: 'test-product-id' },
        'Product not found'
      );
    });

    it('should fail when product has no local image', async () => {
      mockProduct.imageLocal = null;

      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(true),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product has no local image');
    });
  });

  describe('successful posting', () => {
    it('should update product status to POSTED on success', async () => {
      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(true),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      vi.mocked(BrowserManager.getInstance).mockReturnValue({
        getContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            close: vi.fn(),
          }),
        }),
      } as any);

      vi.mocked(CaptchaHandler).mockImplementation(() => ({
        checkAndHandle: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(FBPoster).mockImplementation(() => ({
        post: vi.fn().mockResolvedValue({
          success: true,
          listingUrl: 'https://facebook.com/marketplace/item/123',
        }),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(true);
      expect(result.listingUrl).toBe('https://facebook.com/marketplace/item/123');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
        data: {
          status: 'POSTED',
          postedAt: expect.any(Date),
        },
      });
      expect(prisma.job.create).toHaveBeenCalled();
    });
  });

  describe('failed posting', () => {
    it('should update product status to FAILED on failure', async () => {
      vi.mocked(RateLimiter).mockImplementation(() => ({
        canPostToday: vi.fn().mockResolvedValue(true),
        incrementPostCount: vi.fn(),
        close: vi.fn(),
      } as any));

      vi.mocked(BrowserManager.getInstance).mockReturnValue({
        getContext: vi.fn().mockResolvedValue({
          newPage: vi.fn().mockResolvedValue({
            close: vi.fn(),
          }),
        }),
      } as any);

      vi.mocked(CaptchaHandler).mockImplementation(() => ({
        checkAndHandle: vi.fn().mockResolvedValue(true),
      } as any));

      vi.mocked(FBPoster).mockImplementation(() => ({
        post: vi.fn().mockResolvedValue({
          success: false,
          error: 'Failed to post',
        }),
      } as any));

      const result = await postProductProcessor(mockJob, mockLogger);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to post');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
        data: { status: 'FAILED' },
      });
      expect(prisma.job.create).toHaveBeenCalled();
    });
  });
});
