import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from 'pino';
import { config } from '@bot/config';
import { FBAuth } from '../src/bot/fb-auth';

const logger = createLogger();

async function setupSession() {
  logger.info('Starting Facebook session setup...');

  // Launch browser in headed mode
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  // Create context
  const context = await browser.newContext();

  // Create page
  const page = await context.newPage();

  // Navigate to Facebook
  logger.info('Navigating to Facebook...');
  await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });

  // Prompt user to login
  logger.info('');
  logger.info('═══════════════════════════════════════════════════════');
  logger.info('Please login to Facebook in the browser window.');
  logger.info('After login, press Enter here to save the session...');
  logger.info('═══════════════════════════════════════════════════════');
  logger.info('');

  // Wait for user to press Enter
  await waitForEnter();

  // Verify login
  const isLoggedIn = await verifyLoggedIn(page);
  if (!isLoggedIn) {
    logger.error('Login verification failed. Please try again.');
    await browser.close();
    process.exit(1);
  }

  // Save session
  logger.info('Saving session...');
  const fbAuth = new FBAuth(logger);
  await fbAuth.saveSession(context, config.fbSessionPath);

  logger.info('Session saved successfully!');
  logger.info(`Session path: ${config.fbSessionPath}`);

  // Close browser
  await browser.close();

  logger.info('Setup complete! You can now start the worker.');
}

async function verifyLoggedIn(page: Page): Promise<boolean> {
  try {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check for logged-in indicators
    const loggedInSelectors = [
      '[aria-label="Facebook"]',
      '[data-pagelet="LeftRail"]',
      '[role="navigation"]',
      'text="What\'s on your mind"',
    ];

    for (const selector of loggedInSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  } catch (error) {
    logger.error({ error }, 'Login verification failed');
    return false;
  }
}

async function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

// Run setup
setupSession().catch((error) => {
  logger.error({ error }, 'Session setup failed');
  process.exit(1);
});
