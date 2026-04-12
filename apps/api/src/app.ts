import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import pino from 'pino';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { withRefResolver } from 'fastify-zod';
import config from '@bot/config';

// Create logger
const logger = pino({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Create Fastify instance
const app = fastify(withRefResolver({
  logger,
}));

// Helper to register core features
const setupApp = async () => {
  // Register CORS
  await app.register(cors, {
    origin: config.corsOrigins.split(','),
    credentials: true,
  });

  // Register Helmet (security headers)
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable CSP for simplicity
  });

  // Register Swagger (only in non-production)
  if (config.nodeEnv !== 'production') {
    await app.register(fastifySwagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'FB Marketplace Bot API',
          description: 'API for managing products and triggering Facebook Marketplace posts',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Development server',
          },
        ],
      },
    });

    await app.register(fastifySwaggerUI, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'none',
        deepLinking: true,
      },
    });
  }

  // Request logging
  app.addHook('onRequest', async (request, reply) => {
    logger.info({
      method: request.method,
      url: request.url,
      id: request.id,
    });
  });

  // Response logging
  app.addHook('onResponse', async (request, reply) => {
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    });
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      error: error.message,
      stack: error.stack,
      requestId: request.id,
    });

    // Send error response
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
        statusCode: error.statusCode || 500,
      },
    });
  });
};

// Initialize app
setupApp().catch(err => {
  logger.error(err, 'Failed to setup app');
});

export { app, logger };
