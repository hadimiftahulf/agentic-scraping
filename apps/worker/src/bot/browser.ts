import { chromium, Browser, BrowserContext } from 'playwright';
import { pino } from 'pino';
import { config } from '@bot/config';
import { FBAuth } from './fb-auth';
import { createStealthContext } from './stealth';

export interface FacebookCredentials {
  email: string;
  password: string;
}

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private logger: pino.BaseLogger;
  private sessionRefreshInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_REFRESH_MS = 2 * 60 * 60 * 1000; // 2 hours

  private constructor(logger: pino.BaseLogger) {
    this.logger = logger;
  }

  static getInstance(logger?: pino.BaseLogger): BrowserManager {
    if (!BrowserManager.instance) {
      if (!logger) {
        throw new Error('Logger required for first initialization');
      }
      BrowserManager.instance = new BrowserManager(logger);
    }
    return BrowserManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      this.logger.warn('Browser already initialized');
      return;
    }

    try {
      this.logger.info('Initializing browser');

      this.browser = await chromium.launch({
        headless: config.nodeEnv === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      this.logger.info('Browser launched successfully');

      // Start session refresh interval
      this.startSessionRefreshInterval();

      // Handle browser crash
      this.browser.on('disconnected', () => {
        this.logger.error('Browser disconnected unexpectedly');
        this.handleBrowserCrash();
      });
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize browser');
      throw error;
    }
  }

  async getContext(credentials?: FacebookCredentials): Promise<BrowserContext> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.context || this.context.pages().length === 0 || !this.context.browser()) {
      this.context = await createStealthContext(this.browser!);
      this.logger.info('Created new browser context');

      // Login to Facebook if credentials provided
      if (credentials) {
        const fbAuth = new FBAuth(this.logger);
        await fbAuth.ensureLoggedIn(this.context, credentials);
      }
    }

    return this.context!;
  }

  async close(): Promise<void> {
    this.logger.info('Closing browser');

    // Stop session refresh interval
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }

    // Close context
    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.logger.info('Browser closed successfully');
  }

  private startSessionRefreshInterval(): void {
    this.sessionRefreshInterval = setInterval(async () => {
      try {
        this.logger.info('Refreshing session');
        await this.refreshSession();
      } catch (error) {
        this.logger.error({ error }, 'Error refreshing session');
      }
    }, this.SESSION_REFRESH_MS);

    this.logger.info(`Session refresh interval started (${this.SESSION_REFRESH_MS}ms)`);
  }

  private async refreshSession(): Promise<void> {
    if (!this.context) {
      this.logger.warn('No context to refresh');
      return;
    }

    try {
      // Close existing context and create new one
      await this.context.close();

      // Save credentials before closing
      const credentials = await this.getCredentialsFromContext();

      this.context = await createStealthContext(this.browser!);

      if (credentials) {
        const fbAuth = new FBAuth(this.logger);
        await fbAuth.ensureLoggedIn(this.context, credentials);
      }

      this.logger.info('Session refreshed successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to refresh session');
      throw error;
    }
  }

  private async getCredentialsFromContext(): Promise<FacebookCredentials | null> {
    // In a real implementation, you would store credentials securely
    // For now, we'll return null and expect credentials to be passed separately
    return null;
  }

  private async handleBrowserCrash(): Promise<void> {
    this.logger.warn('Handling browser crash');

    // Clear references
    this.browser = null;
    this.context = null;

    // Stop session refresh interval
    if (this.sessionRefreshInterval) {
      clearInterval(this.sessionRefreshInterval);
      this.sessionRefreshInterval = null;
    }

    // Attempt to restart browser
    try {
      await this.initialize();
      this.logger.info('Browser restarted successfully after crash');
    } catch (error) {
      this.logger.error({ error }, 'Failed to restart browser after crash');
    }
  }

  isBrowserReady(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  isContextReady(): boolean {
    return this.context !== null && this.context.pages().length > 0;
  }
}
