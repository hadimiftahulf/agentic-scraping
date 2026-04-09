/** @type {import('fastify').FastifyPluginAsync } */
import fp from 'fastify';
import prisma from '@bot/db';
import pino from 'pino';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof prisma;
  }
}

const prismaPlugin: import('fastify').FastifyPluginAsync = async (fastify, options) => {
  const logger = fastify.log as pino.Logger;

  try {
    // Test connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Add Prisma client to Fastify instance
    fastify.decorate('db', prisma);

    // Graceful disconnect on close
    fastify.addHook('onClose', async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

export default prismaPlugin;
