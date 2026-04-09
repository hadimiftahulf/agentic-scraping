import { app, logger } from './app';
import prismaPlugin from './plugins/prisma.plugin';
import redisPlugin from './plugins/redis.plugin';
import productsRoute from './routes/products.route';
import jobsRoute from './routes/jobs.route';
import configRoute, { runtimeConfig } from './routes/config.route';
import { QueueService } from './services/queue.service';
import { createQueue } from '@bot/utils/src/queue';
import config from '@bot/config';

/**
 * Main entry point for Fastify API
 */
const start = async () => {
  try {
    // Register plugins
    await app.register(prismaPlugin);
    await app.register(redisPlugin);

    // Initialize queue service
    const queueService = new QueueService();
    await queueService.initialize(app.redis);

    // Decorate Fastify instance with queue
    app.decorate('queue', queueService.getQueue());

    // Register routes
    await app.register(productsRoute);
    await app.register(jobsRoute);
    await app.register(configRoute);

    // Health check endpoint
    app.get('/health', async () => {
      const queueStats = await queueService.getStats();

      return {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: 'ok',
            latencyMs: 0, // Could add actual ping latency
          },
          redis: {
            status: 'ok',
          },
          queue: queueStats,
        },
        config: runtimeConfig,
      };
    });

    // Start server
    await app.listen({ port: config.port, host: '0.0.0.0' });

    logger.info(`🚀 Server ready at http://0.0.0.0:${config.port}`);
    logger.info(`📚 API documentation available at http://0.0.0.0:${config.port}/docs`);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { app, start };
