import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getRandomUserAgent, 
  getRandomViewport, 
  getRandomDelay, 
  detectCaptcha,
  humanHover,
  humanMoveMouseRandomly,
  humanClick
} from "./stealth";

describe("stealth utilities", () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      $: vi.fn(),
      mouse: {
        move: vi.fn().mockResolvedValue(undefined),
      },
      click: vi.fn().mockResolvedValue(undefined),
      viewportSize: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
      evaluate: vi.fn().mockResolvedValue(undefined),
    };
    vi.clearAllMocks();
  });

  describe("getRandomUserAgent", () => {
    it("should return a string from the user agent list", () => {
      const ua = getRandomUserAgent();
      expect(typeof ua).toBe("string");
      expect(ua.length).toBeGreaterThan(10);
    });
  });

  describe("getRandomViewport", () => {
    it("should return a valid viewport object", () => {
      const viewport = getRandomViewport();
      expect(viewport.width).toBeGreaterThanOrEqual(1280);
      expect(viewport.width).toBeLessThanOrEqual(1920);
      expect(viewport.height).toBeGreaterThanOrEqual(720);
      expect(viewport.height).toBeLessThanOrEqual(1080);
    });
  });

  describe("getRandomDelay", () => {
    it("should return a number within the specified range", () => {
      const delay = getRandomDelay(100, 200);
      expect(delay).toBeGreaterThanOrEqual(100);
      expect(delay).toBeLessThanOrEqual(200);
    });
  });

  describe("detectCaptcha", () => {
    it("should return true if a captcha selector is found", async () => {
      mockPage.$.mockImplementation(async (selector: string) => {
        if (selector === '.captcha') return {};
        return null;
      });

      const result = await detectCaptcha(mockPage);
      expect(result).toBe(true);
    });

    it("should return false if no captcha selectors are found", async () => {
      mockPage.$.mockResolvedValue(null);

      const result = await detectCaptcha(mockPage);
      expect(result).toBe(false);
    });
  });

  describe("humanHover", () => {
    it("should move mouse to element", async () => {
      mockPage.$.mockResolvedValue({
        boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 10, width: 100, height: 100 }),
      });

      await humanHover(mockPage, "#test");

      expect(mockPage.mouse.move).toHaveBeenCalled();
    });

    it("should throw if element not found", async () => {
      mockPage.$.mockResolvedValue(null);

      await expect(humanHover(mockPage, "#invalid")).rejects.toThrow("Element not found: #invalid");
    });
  });

  describe("humanMoveMouseRandomly", () => {
    it("should move mouse to a random position", async () => {
      await humanMoveMouseRandomly(mockPage);
      expect(mockPage.mouse.move).toHaveBeenCalled();
    });
  });

  describe("humanClick", () => {
    it("should hover then click", async () => {
      mockPage.$.mockResolvedValue({
        boundingBox: vi.fn().mockResolvedValue({ x: 10, y: 10, width: 100, height: 100 }),
      });

      await humanClick(mockPage, "#test");

      expect(mockPage.mouse.move).toHaveBeenCalled();
      expect(mockPage.click).toHaveBeenCalledWith("#test");
    });
  });
});
