import { chromium, Browser, BrowserContext, Page } from 'playwright';
import pino from 'pino';

export abstract class BasePlaywrightProvider {
  protected logger = pino({ name: this.constructor.name });

  protected async getBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'id-ID',
      timezoneId: 'Asia/Jakarta',
    });

    // Apply stealth
    await context.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    return { browser, context, page };
  }

  protected async cleanup(browser: Browser, context: BrowserContext, page: Page) {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }
}
