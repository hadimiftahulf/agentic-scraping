import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FBPoster, ProductData } from "./fb-poster";
import { Page, BrowserContext } from "playwright";

vi.mock("./stealth", () => ({
  randomDelay: vi.fn().mockResolvedValue(undefined),
  humanClick: vi.fn().mockResolvedValue(undefined),
  humanScroll: vi.fn().mockResolvedValue(undefined),
  takeScreenshot: vi.fn().mockResolvedValue("/path/to/screenshot.png"),
  detectCaptcha: vi.fn().mockResolvedValue(false),
}));

describe("FBPoster", () => {
  let fbPoster: FBPoster;
  let mockLogger: any;
  let mockPage: any;
  let mockContext: any;
  let mockProduct: ProductData;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue({
        click: vi.fn().mockResolvedValue(undefined),
        fill: vi.fn().mockResolvedValue(undefined),
        setInputFiles: vi.fn().mockResolvedValue(undefined),
        scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
      }),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      $: vi.fn().mockResolvedValue(null),
      close: vi.fn().mockResolvedValue(undefined),
      url: vi.fn().mockReturnValue("https://www.facebook.com/marketplace/item/123"),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    };

    mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    mockProduct = {
      id: "test-id",
      title: "Test Product",
      price: 100000,
      description: "Test Description",
      imageLocal: "/path/to/image.jpg",
    };

    fbPoster = new FBPoster(mockContext, mockLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("post", () => {
    it("should complete the full posting flow successfully", async () => {
      // Mock sub-methods or their dependencies to ensure success
      // navigateToMarketplace
      // openNewListingForm (needs to find create button)
      mockPage.$.mockResolvedValue({}); // Found indicators
      
      const result = await fbPoster.post(mockProduct);

      expect(result.success).toBe(true);
      expect(result.listingUrl).toBe("https://www.facebook.com/marketplace/item/123");
      expect(mockLogger.info).toHaveBeenCalledWith(
        { productId: mockProduct.id },
        "Starting product posting"
      );
    });

    it("should handle failures and return error result", async () => {
      // Simulate failure in navigateToMarketplace
      mockPage.goto.mockRejectedValue(new Error("Network error"));

      const result = await fbPoster.post(mockProduct);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("navigateToMarketplace", () => {
    it("should navigate and scroll", async () => {
      await fbPoster.navigateToMarketplace(mockPage);
      expect(mockPage.goto).toHaveBeenCalledWith(
        "https://www.facebook.com/marketplace",
        expect.any(Object)
      );
    });
  });

  describe("openNewListingForm", () => {
    it("should find and click create button", async () => {
      mockPage.waitForSelector.mockResolvedValue({});
      mockPage.$.mockResolvedValue({}); // Found selector

      await fbPoster.openNewListingForm(mockPage);
      expect(mockPage.waitForSelector).toHaveBeenCalled();
    });

    it("should throw if create button not found", async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error("Timeout"));

      await expect(fbPoster.openNewListingForm(mockPage)).rejects.toThrow(
        'Could not find "Create new listing" button'
      );
    });
  });

  describe("submitListing", () => {
    it("should click submit and verify success", async () => {
      mockPage.waitForSelector.mockResolvedValue({
        scrollIntoViewIfNeeded: vi.fn(),
      });
      mockPage.$.mockResolvedValueOnce({}).mockResolvedValueOnce({}); // 1. for submit loop, 2. for verifySuccess loop

      const result = await fbPoster.submitListing(mockPage);

      expect(result.success).toBe(true);
    });
  });
});
