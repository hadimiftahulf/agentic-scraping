import { PrismaClient } from '@bot/db';
import { config } from '@bot/config';
import pino from 'pino';
import cron from 'node-cron';
import { ScraperOrchestrator } from './orchestrator';
import { JakartaNotebookProvider } from './providers/jakartanotebook.provider';
import { TokopediaProvider } from './providers/tokopedia.provider';
import { ShopeeProvider } from './providers/shopee.provider';

const logger = pino({ name: 'ScraperService' });
const db = new PrismaClient();

// Initialize providers
const providers = [
  new JakartaNotebookProvider(),
  new TokopediaProvider(),
  new ShopeeProvider(),
];

// Store scheduled tasks
const scrapingTasks: cron.ScheduledTask[] = [];

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down scraper service...');

  scrapingTasks.forEach(task => task.stop());
  logger.info('Scheduler tasks stopped');

  try {
    await db.$disconnect();
    logger.info('Database disconnected');
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
  }

  logger.info('Scraper service stopped');
  process.exit(0);
}

// Register signal handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

/**
 * Main entry point
 */
async function main() {
  logger.info('Scraper service starting...');

  // Setup periodic scheduler for each provider
  const intervalMinutes = config.scraperIntervalMinutes || 20;
  // Cron expression for every N minutes: */N * * * *
  const cronExpression = `*/${intervalMinutes} * * * *`;
  
  for (const provider of providers) {
    const orchestrator = new ScraperOrchestrator(db, provider);
    
    // We use a specific target URL for each provider from config if available, 
    // or fallback to a default if intended. 
    // For now we use config.targetUrl as per existing logic, but in a real 
    // multi-source scenario, this would be provider-specific.
    const targetUrl = config.targetUrl;

    logger.info({ provider: provider.name, targetUrl }, 'Initializing provider');

    // Initial run
    try {
      logger.info({ provider: provider.name }, 'Starting initial scraping cycle');
      await orchestrator.runCycle(targetUrl);
    } catch (err) {
      logger.error({ err, provider: provider.name }, 'Error in initial scraping cycle');
    }

    logger.info({ provider: provider.name, intervalMinutes, cronExpression }, 'Setting up scheduler');
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        logger.info({ provider: provider.name }, 'Starting scheduled scraping cycle');
        await orchestrator.runCycle(targetUrl);
      } catch (err) {
        logger.error({ err, provider: provider.name }, 'Error in scheduled scraping cycle');
      }
    });

    scrapingTasks.push(task);
  }

  logger.info('Scraper service is running and scheduled for all providers');
}

// Start the service
main().catch((err) => {
  logger.error({ err }, 'Fatal error in main loop');
  process.exit(1);
});
