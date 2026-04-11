import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BasePlaywrightProvider } from './base-playwright.provider';
import { chromium } from 'playwright';

vi.mock('playwright', () => {
  const page = {
    setDefaultTimeout: vi.fn(),
    evaluate: vi.fn(),
    close: vi.fn(),
  };
  const context = {
    addInitScript: vi.fn(),
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn(),
  };
  const browser = {
    newContext: vi.fn().mockResolvedValue(context),
    close: vi.fn(),
  };
  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(browser),
    },
  };
});

class TestProvider extends BasePlaywrightProvider {
  async testGetBrowser() {
    return this.getBrowser();
  }
  
  async testCleanup(browser: any, context: any, page: any) {
    return this.cleanup(browser, context, page);
  }
}

describe('BasePlaywrightProvider', () => {
  it('should initialize browser with stealth configuration', async () => {
    const provider = new TestProvider();
    const { browser, context, page } = await provider.testGetBrowser();
    
    expect(chromium.launch).toHaveBeenCalledWith(expect.objectContaining({
      headless: true,
      args: expect.arrayContaining(['--no-sandbox', '--disable-blink-features=AutomationControlled']),
    }));
    
    expect(browser.newContext).toHaveBeenCalledWith(expect.objectContaining({
      userAgent: expect.any(String),
      viewport: expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    }));
    
    expect(context.addInitScript).toHaveBeenCalled();
    expect(page.setDefaultTimeout).toHaveBeenCalledWith(30000);
    
    await provider.testCleanup(browser, context, page);
    expect(page.close).toHaveBeenCalled();
    expect(context.close).toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalled();
  });
});
