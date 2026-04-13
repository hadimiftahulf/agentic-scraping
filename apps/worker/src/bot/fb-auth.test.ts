import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FBAuth } from "./fb-auth";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { Page, BrowserContext } from "playwright";

vi.mock("fs/promises");
vi.mock("./stealth", () => ({
  humanType: vi.fn().mockResolvedValue(undefined),
  humanScroll: vi.fn().mockResolvedValue(undefined),
}));

describe("FBAuth", () => {
  let fbAuth: FBAuth;
  let mockLogger: any;
  let mockPage: any;
  let mockContext: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForSelector: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      $: vi.fn().mockResolvedValue(null),
      screenshot: vi.fn().mockResolvedValue(Buffer.from([])),
      close: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn(),
    };

    mockContext = {
      cookies: vi.fn().mockResolvedValue([]),
      addCookies: vi.fn().mockResolvedValue(undefined),
      newPage: vi.fn().mockResolvedValue(mockPage),
    };

    fbAuth = new FBAuth(mockLogger);
    
    // Mock private delay methods
    vi.spyOn(fbAuth as any, 'randomDelay').mockResolvedValue(undefined);
    vi.spyOn(fbAuth as any, 'sleep').mockResolvedValue(undefined);
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loginFacebook", () => {
    it("should return true if already logged in", async () => {
      mockPage.$.mockImplementation(async (selector: string) => {
        if (selector === '[aria-label="Facebook"]') return {};
        return null;
      });

      const result = await fbAuth.loginFacebook(mockPage, {
        email: "test@example.com",
        password: "password",
      });

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Already logged in to Facebook");
    });

    it("should perform login if not logged in", async () => {
      let callCount = 0;
      mockPage.$.mockImplementation(async () => {
        callCount++;
        // checkLoggedIn has 4 selectors. 
        // First call to checkLoggedIn will call $ 4 times.
        if (callCount > 4) return {}; 
        return null;
      });

      const result = await fbAuth.loginFacebook(mockPage, {
        email: "test@example.com",
        password: "password",
      });

      expect(result).toBe(true);
      expect(mockPage.goto).toHaveBeenCalledWith("https://www.facebook.com", expect.any(Object));
      expect(mockPage.click).toHaveBeenCalledWith('button[name="login"]');
    });

    it("should handle login failure", async () => {
      mockPage.$.mockResolvedValue(null);

      const result = await fbAuth.loginFacebook(mockPage, {
        email: "test@example.com",
        password: "password",
      });

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith("Facebook login failed");
    });
  });

  describe("saveSession", () => {
    it("should save and encrypt session data", async () => {
      const sessionPath = "/tmp/session.json";
      mockContext.cookies.mockResolvedValue([{ name: "test", value: "value" }]);
      
      mockPage.evaluate.mockResolvedValue({ key: "value" });

      await fbAuth.saveSession(mockContext, sessionPath);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({ sessionPath }),
        "Session saved and encrypted successfully"
      );
    });
  });

  describe("loadSession", () => {
    it("should return false if session file does not exist", async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error("File not found"));

      const result = await fbAuth.loadSession(mockContext, "invalid.json");

      expect(result).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith("Session file does not exist");
    });

    it("should load and verify valid session", async () => {
      const sessionPath = "valid.json";
      const sessionData = {
        cookies: [{ name: "test", value: "value" }],
        localStorage: { key: "value" },
      };

      const encrypted = (fbAuth as any).encrypt(JSON.stringify(sessionData));

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(encrypted);
      
      mockPage.$.mockResolvedValueOnce({});

      const result = await fbAuth.loadSession(mockContext, sessionPath);

      expect(result).toBe(true);
      expect(mockContext.addCookies).toHaveBeenCalledWith(sessionData.cookies);
      expect(mockLogger.info).toHaveBeenCalledWith("Session loaded and verified successfully");
    });
  });
});
