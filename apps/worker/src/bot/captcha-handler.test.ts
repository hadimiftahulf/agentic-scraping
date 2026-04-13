import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CaptchaHandler } from "./captcha-handler";
import { detectCaptcha, takeScreenshot } from "./stealth";

vi.mock("./stealth", () => ({
  detectCaptcha: vi.fn(),
  takeScreenshot: vi.fn(),
}));

describe("CaptchaHandler", () => {
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
    // Mock sleep to not actually wait
    vi.spyOn(captchaHandler as any, 'sleep').mockResolvedValue(undefined);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkAndHandle", () => {
    it("should return false when no captcha detected", async () => {
      vi.mocked(detectCaptcha).mockResolvedValue(false);

      const result = await captchaHandler.checkAndHandle(
        mockPage,
        "test-job-id",
      );

      expect(result).toBe(false);
      expect(detectCaptcha).toHaveBeenCalledWith(mockPage);
    });

    it("should pause when captcha is detected", async () => {
      // 1. Initial detection: true
      // 2. After sleep check: true (still present)
      vi.mocked(detectCaptcha).mockResolvedValue(true);
      vi.mocked(takeScreenshot).mockResolvedValue("/path/to/screenshot.png");

      const result = await captchaHandler.checkAndHandle(
        mockPage,
        "test-job-id",
      );

      expect(result).toBe(false); // Fails because captcha still present after pause
      expect(takeScreenshot).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith("Captcha still present after pause, failing job");
    });

    it("should return true if paused but captcha resolved after pause", async () => {
      // Setup state: already paused
      captchaHandler["isPaused"] = true;
      captchaHandler["pauseEndTime"] = Date.now() - 1000;

      // checkAndHandle first calls detectCaptcha()
      // If it returns false, it will now check if it was paused and resolved
      vi.mocked(detectCaptcha).mockResolvedValue(false); 

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(true);
      expect(captchaHandler["isPaused"]).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith("Captcha resolved, resuming work");
    });

    it("should remain paused if still within pause period", async () => {
      captchaHandler["isPaused"] = true;
      captchaHandler["pauseEndTime"] = Date.now() + 60000;

      // Initially captcha is detected again
      vi.mocked(detectCaptcha).mockResolvedValue(true);

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ remainingTime: 1 }),
        "Still in pause period, waiting...",
      );
    });

    it("should fail if captcha persists after pause (new cycle)", async () => {
      // 1. Initial detection
      // 2. After sleep check
      vi.mocked(detectCaptcha).mockResolvedValue(true);
      vi.mocked(takeScreenshot).mockResolvedValue("/path/to/screenshot.png");

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Captcha still present after pause, failing job",
      );
    });

    it("should resume if captcha resolved after initial detection sleep", async () => {
      // 1. Initial detection: true
      // 2. After sleep check: false (resolved)
      vi.mocked(detectCaptcha).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      vi.mocked(takeScreenshot).mockResolvedValue("/path/to/screenshot.png");

      const result = await captchaHandler.checkAndHandle(mockPage);

      expect(result).toBe(true);
      expect(captchaHandler["isPaused"]).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith("Captcha resolved, resuming work");
    });
  });

  describe("pause state management", () => {
    it("should correctly report pause state", () => {
      expect(captchaHandler.isWorkerPaused()).toBe(false);

      captchaHandler["isPaused"] = true;
      expect(captchaHandler.isWorkerPaused()).toBe(true);
    });

    it("should calculate remaining pause time correctly", () => {
      captchaHandler["isPaused"] = true;
      captchaHandler["pauseEndTime"] = Date.now() + 60000;

      const remaining = captchaHandler.getPauseRemainingTime();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(60000);
    });

    it("should return 0 remaining time when not paused", () => {
      captchaHandler["isPaused"] = false;

      const remaining = captchaHandler.getPauseRemainingTime();
      expect(remaining).toBe(0);
    });
  });

  describe("pause method", () => {
    it("should pause for specified duration", async () => {
      await captchaHandler.pause(5000);
      expect(captchaHandler.isWorkerPaused()).toBe(false);
    });
  });
});
