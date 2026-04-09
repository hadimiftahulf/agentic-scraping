import { Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function getRandomViewport(): { width: number; height: number } {
  const width = Math.floor(Math.random() * (1920 - 1280 + 1)) + 1280;
  const height = Math.floor(Math.random() * (1080 - 720 + 1)) + 720;
  return { width, height };
}

export function getRandomDelay(min: number = 1000, max: number = 3000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = getRandomDelay(min, max);
  await new Promise(resolve => setTimeout(resolve, delay));
}

export async function humanType(
  page: Page,
  selector: string,
  text: string,
  options?: { minDelay?: number; maxDelay?: number }
): Promise<void> {
  const minDelay = options?.minDelay || 50;
  const maxDelay = options?.maxDelay || 150;

  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  await element.click();
  await randomDelay(200, 500);

  for (let i = 0; i < text.length; i++) {
    await element.type(text[i], { delay: getRandomDelay(minDelay, maxDelay) });
  }

  await randomDelay(100, 300);
}

export async function humanScroll(page: Page, options?: { minScrolls?: number; maxScrolls?: number }): Promise<void> {
  const minScrolls = options?.minScrolls || 1;
  const maxScrolls = options?.maxScrolls || 3;
  const scrollCount = Math.floor(Math.random() * (maxScrolls - minScrolls + 1)) + minScrolls;

  for (let i = 0; i < scrollCount; i++) {
    const scrollY = Math.floor(Math.random() * 500) + 200;
    await page.evaluate((y) => window.scrollBy(0, y), scrollY);
    await randomDelay(300, 800);
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await randomDelay(200, 500);
}

export async function humanClick(page: Page, selector: string): Promise<void> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`Element bounding box not found: ${selector}`);
  }

  // Move mouse to element with random offset
  const x = box.x + Math.random() * box.width;
  const y = box.y + Math.random() * box.height;

  await page.mouse.move(x, y);
  await randomDelay(100, 300);

  await element.click();
  await randomDelay(200, 500);
}

export async function createStealthContext(browser: Browser): Promise<BrowserContext> {
  const userAgent = getRandomUserAgent();
  const viewport = getRandomViewport();

  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    permissions: ['geolocation'],
    geolocation: { longitude: -74.006, latitude: 40.7128 }, // New York coordinates
    colorScheme: 'light',
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: false,
  });

  // Override navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Override platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Add Chrome object
    (window as any).chrome = {
      runtime: {},
    };

    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: 'granted' } as PermissionStatus) :
        originalQuery(parameters)
    );
  });

  // Disable WebRTC leak
  await context.addInitScript(() => {
    const originalRTCPeerConnection = (window as any).RTCPeerConnection;
    (window as any).RTCPeerConnection = function(...args: any[]) {
      const pc = new originalRTCPeerConnection(...args);

      const originalCreateDataChannel = pc.createDataChannel;
      pc.createDataChannel = function() {
        const channel = originalCreateDataChannel.apply(this, args);
        const originalSend = channel.send;
        channel.send = function() {
          // Prevent WebRTC leaks
          return originalSend.apply(this, args);
        };
        return channel;
      };

      return pc;
    };
  });

  return context;
}

export async function detectCaptcha(page: Page): Promise<boolean> {
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="captcha"]',
    '.captcha',
    '[class*="captcha"]',
    '[id*="captcha"]',
    'text=/security check|verify|checkpoint/i',
    'text=/are you a robot|human verification/i',
  ];

  for (const selector of captchaSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        return true;
      }
    } catch {
      // Selector might be invalid, continue
    }
  }

  return false;
}

export async function takeScreenshot(page: Page, filename: string): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  await require('fs/promises').mkdir(screenshotDir, { recursive: true });

  const screenshotPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return screenshotPath;
}
