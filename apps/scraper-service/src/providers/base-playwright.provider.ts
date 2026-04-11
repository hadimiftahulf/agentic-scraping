import { chromium, Browser, BrowserContext, Page } from 'playwright';
import pino from 'pino';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

export abstract class BasePlaywrightProvider {
  protected logger = pino({ name: this.constructor.name });

  protected getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  protected getRandomViewport(): { width: number; height: number } {
    const width = Math.floor(Math.random() * (1920 - 1280 + 1)) + 1280;
    const height = Math.floor(Math.random() * (1080 - 720 + 1)) + 720;
    return { width, height };
  }

  protected async getBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
      ],
    });

    const context = await browser.newContext({
      viewport: this.getRandomViewport(),
      userAgent: this.getRandomUserAgent(),
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
    });

    // Apply stealth init scripts
    await context.addInitScript(() => {
      // Override webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['id-ID', 'id', 'en-US', 'en'],
      });

      // Add chrome object
      (window as any).chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };

      // Permissions API override
      const originalQuery = window.navigator.permissions.query;
      (window.navigator.permissions as any).query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: 'denied' }) :
          originalQuery(parameters)
      );
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    return { browser, context, page };
  }

  protected async randomDelay(min: number = 500, max: number = 2000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  protected async humanScroll(page: Page): Promise<void> {
    const scrollCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < scrollCount; i++) {
      const scrollY = Math.floor(Math.random() * 400) + 100;
      await page.evaluate((y) => window.scrollBy(0, y), scrollY);
      await this.randomDelay(200, 500);
    }
  }

  protected async cleanup(browser: Browser, context: BrowserContext, page: Page) {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}
