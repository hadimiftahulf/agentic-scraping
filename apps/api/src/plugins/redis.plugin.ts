/** @type {import('fastify').FastifyPluginAsync } */
import fp from 'fastify';
import IORedis from 'ioredis';
import pino from 'pino';
import config from '@bot/config';

declare module 'fastify' {
  interface FastifyInstance {
    redis: IORedis;
  }
}

const redisPlugin: import('fastify').FastifyPluginAsync = async (fastify, options) => {
  const logger = fastify.log as pino.Logger;

  try {
    // Create Redis connection
    const redis = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    // Test connection
    await redis.ping();
    logger.info('Redis connected successfully');

    // Add Redis client to Fastify instance
    fastify.decorate('redis', redis);

    // Graceful disconnect on close
    fastify.addHook('onClose', async () => {
      await redis.quit();
      logger.info('Redis disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export default redisPlugin;
