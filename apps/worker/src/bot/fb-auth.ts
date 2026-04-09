import { Page, BrowserContext } from 'playwright';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '@bot/config';
import { pino } from 'pino';
import { humanType, humanScroll } from './stealth';

export interface Credentials {
  email: string;
  password: string;
}

export interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
}

export class FBAuth {
  private logger: pino.BaseLogger;

  constructor(logger: pino.BaseLogger) {
    this.logger = logger;
  }

  async loginFacebook(page: Page, credentials: Credentials): Promise<boolean> {
    try {
      this.logger.info('Attempting to login to Facebook');

      // Navigate to Facebook
      await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });

      // Check if already logged in
      const isLoggedIn = await this.checkLoggedIn(page);
      if (isLoggedIn) {
        this.logger.info('Already logged in to Facebook');
        return true;
      }

      // Wait for login form
      await page.waitForSelector('input[name="email"]', { timeout: 10000 });

      // Fill email with human-like typing
      await humanType(page, 'input[name="email"]', credentials.email);
      await humanType(page, 'input[name="pass"]', credentials.password);

      // Random delay before clicking
      await this.randomDelay(1000, 3000);

      // Click login button
      await page.click('button[name="login"]');

      // Wait for navigation or 2FA checkpoint
      await page.waitForLoadState('networkidle', { timeout: 30000 });

      // Check for 2FA checkpoint
      const twoFactorCheckpoint = await page.$('text=/security check|2-factor|two-factor/i');
      if (twoFactorCheckpoint) {
        this.logger.warn('2FA checkpoint detected, pausing for manual intervention');

        // Take screenshot
        const screenshotPath = path.join(process.cwd(), 'screenshots', `2fa-${Date.now()}.png`);
        await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath });
        this.logger.info({ screenshotPath }, '2FA screenshot saved');

        // Wait for 30 minutes for manual intervention
        this.logger.info('Waiting for 30 minutes for manual 2FA completion...');
        await this.sleep(30 * 60 * 1000);

        // Check if login succeeded after wait
        const isLoggedIn = await this.checkLoggedIn(page);
        if (isLoggedIn) {
          this.logger.info('2FA completed successfully');
          return true;
        } else {
          this.logger.error('2FA not completed, login failed');
          return false;
        }
      }

      // Verify login successful
      const loginSuccess = await this.checkLoggedIn(page);
      if (loginSuccess) {
        this.logger.info('Facebook login successful');
        return true;
      } else {
        this.logger.error('Facebook login failed');
        return false;
      }
    } catch (error) {
      this.logger.error({ error }, 'Error during Facebook login');
      return false;
    }
  }

  async saveSession(context: BrowserContext, sessionPath: string): Promise<void> {
    try {
      this.logger.info('Saving Facebook session');

      // Get cookies
      const cookies = await context.cookies();

      // Get localStorage
      const localStorage = await this.getLocalStorage(context);

      const sessionData: SessionData = {
        cookies,
        localStorage,
      };

      // Encrypt session data
      const encrypted = this.encrypt(JSON.stringify(sessionData));

      // Ensure directory exists
      await fs.mkdir(path.dirname(sessionPath), { recursive: true });

      // Write encrypted session to file
      await fs.writeFile(sessionPath, encrypted);

      this.logger.info({ sessionPath }, 'Session saved and encrypted successfully');
    } catch (error) {
      this.logger.error({ error }, 'Error saving session');
      throw error;
    }
  }

  async loadSession(context: BrowserContext, sessionPath: string): Promise<boolean> {
    try {
      this.logger.info({ sessionPath }, 'Loading Facebook session');

      // Check if session file exists
      try {
        await fs.access(sessionPath);
      } catch {
        this.logger.info('Session file does not exist');
        return false;
      }

      // Read encrypted session
      const encrypted = await fs.readFile(sessionPath, 'utf-8');

      // Decrypt session
      const decrypted = this.decrypt(encrypted);
      const sessionData: SessionData = JSON.parse(decrypted);

      // Load cookies
      await context.addCookies(sessionData.cookies);

      // Load localStorage
      await this.setLocalStorage(context, sessionData.localStorage);

      // Verify session is valid
      const page = await context.newPage();
      await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
      const isValid = await this.checkLoggedIn(page);
      await page.close();

      if (isValid) {
        this.logger.info('Session loaded and verified successfully');
        return true;
      } else {
        this.logger.warn('Session loaded but invalid, re-login required');
        return false;
      }
    } catch (error) {
      this.logger.error({ error }, 'Error loading session');
      return false;
    }
  }

  async ensureLoggedIn(context: BrowserContext, credentials: Credentials): Promise<Page> {
    try {
      const sessionValid = await this.loadSession(context, config.fbSessionPath);

      if (!sessionValid) {
        this.logger.info('Session invalid, logging in...');
        const page = await context.newPage();
        await page.goto('https://www.facebook.com', { waitUntil: 'networkidle' });
        const loginSuccess = await this.loginFacebook(page, credentials);

        if (loginSuccess) {
          await this.saveSession(context, config.fbSessionPath);
          return page;
        } else {
          throw new Error('Failed to login to Facebook');
        }
      }

      return context.newPage();
    } catch (error) {
      this.logger.error({ error }, 'Error ensuring logged in');
      throw error;
    }
  }

  private async checkLoggedIn(page: Page): Promise<boolean> {
    try {
      // Check for common logged-in indicators
      const loggedInSelectors = [
        '[aria-label="Facebook"]', // FB logo
        '[data-pagelet="LeftRail"]', // Left sidebar
        '[role="navigation"]', // Navigation
        'text=What\'s on your mind', // Status input
      ];

      for (const selector of loggedInSelectors) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private async getLocalStorage(context: BrowserContext): Promise<Record<string, string>> {
    const page = await context.newPage();
    const result = await page.evaluate(() => {
      const storage: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key) || '';
        }
      }
      return storage;
    });
    await page.close();
    return result;
  }

  private async setLocalStorage(context: BrowserContext, data: Record<string, string>): Promise<void> {
    const page = await context.newPage();
    await page.evaluate((data) => {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }, data);
    await page.close();
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(config.sessionEncryptKey, 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encrypted: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(config.sessionEncryptKey, 'utf8').slice(0, 32);

    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
