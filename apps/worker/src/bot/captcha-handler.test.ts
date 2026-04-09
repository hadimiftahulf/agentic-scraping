import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaptchaHandler } from './captcha-handler';
import { detectCaptcha, takeScreenshot } from './stealth';

describe('CaptchaHandler', () => {
  let captchaHandler: CaptchaHandler;
  let mockLogger: any;
  let mockPage: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockPage = {};

    captchaHandler = new CaptchaHandler(mockLogger);

    vi.mock('./stealth', () => ({
      detectCaptcha: vi.fn(),
      takeScreenshot: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndHandle', () => {
    it('should return false when no captcha detected', async () => {
      vi.mocked(detectCaptcha).mockResolvedValue(false);

      const result = await captchaHandler.checkAndHandle(mockPage, 'test-job-id');

      expect(result).toBe(false);
      expect(detectCaptcha).toHaveBeenCalledWith(mockPage);
    });

    it('should pause when captcha is detected', async () => {
      vi.mocked(detectCaptcha).mockResolvedValue(true);
      vi.mocked(takeScreenshot).mockResolvedValue('/path/to/screenshot.png');

      // Mock sleep to not actually wait
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn, delay) => {
        fn();
        return {} as any;
      }) as any;

      const result = await captchaHandler.checkAndHandle(mockPage, 'test-job-id');

      global.setTimeout = originalSetTimeout;

      expect(result).toBe(true);
      expect(takeScreenshot).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should remain paused if still within pause period', async () => {
      captchaHandler['isPaused'] = true;
      captchaHandler['pauseEndTime'] = Date.now() + 60000; // 1 minute from now

      vi.mocked(detectCaptcha).mockResolvedValue(true);

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ remainingTime: 1 }),
        'Still in pause period, waiting...'
      );
    });

    it('should fail if captcha persists after pause', async () => {
      vi.mocked(detectCaptcha).mockResolvedValue(true);
      vi.mocked(takeScreenshot).mockResolvedValue('/path/to/screenshot.png');

      // Mock sleep to not actually wait
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn, delay) => {
        fn();
        return {} as any;
      }) as any;

      const result = await captchaHandler.checkAndHandle(mockPage);

      global.setTimeout = originalSetTimeout;

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Captcha still present after pause, failing job'
      );
    });

    it('should resume if captcha resolved after pause', async () => {
      captchaHandler['isPaused'] = true;
      captchaHandler['pauseEndTime'] = Date.now() - 1000; // 1 second ago

      vi.mocked(detectCaptcha).mockResolvedValue(false);

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(true);
      expect(captchaHandler['isPaused']).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Captcha resolved, resuming work'
      );
    });
  });

  describe('pause state management', () => {
    it('should correctly report pause state', () => {
      expect(captchaHandler.isWorkerPaused()).toBe(false);

      captchaHandler['isPaused'] = true;
      expect(captchaHandler.isWorkerPaused()).toBe(true);
    });

    it('should calculate remaining pause time correctly', () => {
      captchaHandler['isPaused'] = true;
      captchaHandler['pauseEndTime'] = Date.now() + 60000;

      const remaining = captchaHandler.getPauseRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60000);
    });

    it('should return 0 remaining time when not paused', () => {
      captchaHandler['isPaused'] = false;

      const remaining = captchaHandler.getPauseRemainingTime();
      expect(remaining).toBe(0);
    });
  });

  describe('pause method', () => {
    it('should pause for specified duration', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn, delay) => {
        fn();
        return {} as any;
      }) as any;

      await captchaHandler.pause(5000);

      global.setTimeout = originalSetTimeout;

      expect(captchaHandler.isWorkerPaused()).toBe(false);
    });
  });
});
