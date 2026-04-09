import express from 'express';
import { BrowserManager } from './bot/browser';
import { createLogger } from 'pino';

const router = express();
const logger = createLogger();

interface WorkerHealth {
  status: 'healthy' | 'unhealthy';
  checks: {
    browser: { status: 'ok' | 'error'; message?: string };
    context: { status: 'ok' | 'error'; message?: string };
  };
  uptime: number;
  version: string;
  timestamp: string;
}

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const browserManager = BrowserManager.getInstance(logger);
    const isReady = browserManager.isBrowserReady() && browserManager.isContextReady();

    if (isReady) {
      res.json({ status: 'ok' });
    } else {
      res.status(503).json({ status: 'error', message: 'Worker not ready' });
    }
  } catch (error) {
    logger.error({ error }, 'Worker health check failed');
    res.status(503).json({ status: 'error', message: 'Service unavailable' });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health: WorkerHealth = {
    status: 'healthy',
    checks: {
      browser: { status: 'ok' },
      context: { status: 'ok' },
    },
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  };

  let hasError = false;

  try {
    const browserManager = BrowserManager.getInstance(logger);

    // Check browser
    if (browserManager.isBrowserReady()) {
      health.checks.browser = { status: 'ok' };
    } else {
      hasError = true;
      health.checks.browser = {
        status: 'error',
        message: 'Browser not initialized',
      };
    }

    // Check context
    if (browserManager.isContextReady()) {
      health.checks.context = { status: 'ok' };
    } else {
      hasError = true;
      health.checks.context = {
        status: 'error',
        message: 'Browser context not ready',
      };
    }
  } catch (error) {
    hasError = true;
    health.checks.browser = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    logger.error({ error }, 'Worker health check failed');
  }

  if (hasError) {
    health.status = 'unhealthy';
  }

  const statusCode = hasError ? 503 : 200;
  res.status(statusCode).json(health);
});

export default router;
