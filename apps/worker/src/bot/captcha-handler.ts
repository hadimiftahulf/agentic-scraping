import { Page } from 'playwright';
import { pino } from 'pino';
import { takeScreenshot, detectCaptcha } from './stealth';

export class CaptchaHandler {
  private logger: pino.BaseLogger;
  private isPaused: boolean = false;
  private pauseEndTime: number = 0;
  private readonly PAUSE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  constructor(logger: pino.BaseLogger) {
    this.logger = logger;
  }

  async checkAndHandle(page: Page, jobId?: string): Promise<boolean> {
    const isCaptcha = await detectCaptcha(page);

    if (!isCaptcha) {
      if (this.isPaused && Date.now() >= this.pauseEndTime) {
        this.logger.info('Captcha resolved, resuming work');
        this.isPaused = false;
        return true;
      }
      return false; // No captcha detected, continue
    }

    this.logger.warn({ jobId }, 'Captcha detected');

    // Take screenshot
    const screenshotPath = await takeScreenshot(page, `captcha-${jobId || 'unknown'}-${Date.now()}.png`);
    this.logger.info({ screenshotPath }, 'Captcha screenshot saved');

    // Check if we're already paused
    if (this.isPaused) {
      if (Date.now() < this.pauseEndTime) {
        const remainingTime = Math.ceil((this.pauseEndTime - Date.now()) / 1000 / 60);
        this.logger.info({ remainingTime }, 'Still in pause period, waiting...');
        await this.sleep(60000); // Sleep for 1 minute
        return true; // Still paused
      } else {
        // Pause period over, but captcha still present
        this.logger.error('Captcha still present after pause, failing job');
        this.isPaused = false;
        return false; 
      }
    }

    // First time detecting captcha, pause
    this.logger.info('Pausing worker for 30 minutes to allow manual intervention');
    await this.notifyAdmin(screenshotPath, jobId);

    this.isPaused = true;
    this.pauseEndTime = Date.now() + this.PAUSE_DURATION_MS;

    // Wait for pause duration (in production this blocks the processor)
    await this.sleep(this.PAUSE_DURATION_MS);

    // After sleep, check again
    const stillCaptcha = await detectCaptcha(page);
    if (stillCaptcha) {
      this.logger.error('Captcha still present after pause, failing job');
      // Keep isPaused true or false? If we fail the job, we should probably allow next job to try or keep pausing.
      // Resetting for now so next job triggers a new pause cycle if needed.
      this.isPaused = false;
      return false;
    }

    this.logger.info('Captcha resolved, resuming work');
    this.isPaused = false;
    return true;
  }

  private async notifyAdmin(screenshotPath: string, jobId?: string): Promise<void> {
    this.logger.warn(
      {
        jobId,
        screenshotPath,
        pauseDuration: this.PAUSE_DURATION_MS / 1000 / 60,
      },
      'CAPTCHA DETECTED - Worker paused. Please manually complete the captcha check.'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isWorkerPaused(): boolean {
    return this.isPaused;
  }

  getPauseRemainingTime(): number {
    if (!this.isPaused) {
      return 0;
    }
    return Math.max(0, this.pauseEndTime - Date.now());
  }

  async pause(ms: number): Promise<void> {
    this.isPaused = true;
    this.pauseEndTime = Date.now() + ms;
    await this.sleep(ms);
    this.isPaused = false;
  }
}
