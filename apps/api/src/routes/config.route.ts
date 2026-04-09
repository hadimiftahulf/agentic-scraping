/** @type {import('fastify').FastifyPlugin } */
import fp from 'fastify';
import { GetConfigSchema } from '../schemas/product.schema';
import { ValidationError } from '../middleware/errors';
import config from '@bot/config';

// Runtime config (can be modified without restart)
let runtimeConfig = {
  markupPercent: config.priceMarkupPercent,
  minPrice: config.minPrice,
  maxPrice: config.maxPrice,
  maxPostPerDay: config.maxPostPerDay,
  blacklistKeywords: config.blacklistKeywords,
  scraperIntervalMinutes: config.scraperIntervalMinutes,
};

const configRoute: import('fastify').FastifyPlugin = async (fastify, options) => {
  /**
   * GET /config - Get current configuration
   */
  fastify.get('/config', async (request, reply) => {
    return {
      data: runtimeConfig,
    };
  });

  /**
   * PATCH /config - Update configuration (partial update)
   */
  fastify.patch('/config', async (request, reply) => {
    try {
      // Parse request body
      const updates = GetConfigSchema.parse(request.body);

      // Validate and apply updates
      if (updates.markupPercent !== undefined) {
        if (updates.markupPercent < 0 || updates.markupPercent > 200) {
          throw new ValidationError('markupPercent must be between 0 and 200');
        }
        runtimeConfig.markupPercent = updates.markupPercent;
      }

      if (updates.minPrice !== undefined) {
        if (updates.minPrice < 0) {
          throw new ValidationError('minPrice must be >= 0');
        }
        runtimeConfig.minPrice = updates.minPrice;
      }

      if (updates.maxPrice !== undefined) {
        if (updates.maxPrice < 0) {
          throw new ValidationError('maxPrice must be >= 0');
        }
        runtimeConfig.maxPrice = updates.maxPrice;
      }

      if (updates.maxPostPerDay !== undefined) {
        if (updates.maxPostPerDay < 1 || updates.maxPostPerDay > 50) {
          throw new ValidationError('maxPostPerDay must be between 1 and 50');
        }
        runtimeConfig.maxPostPerDay = updates.maxPostPerDay;
      }

      if (updates.blacklistKeywords !== undefined) {
        if (!Array.isArray(updates.blacklistKeywords)) {
          throw new ValidationError('blacklistKeywords must be an array');
        }
        runtimeConfig.blacklistKeywords = updates.blacklistKeywords;
      }

      if (updates.scraperIntervalMinutes !== undefined) {
        if (updates.scraperIntervalMinutes < 1 || updates.scraperIntervalMinutes > 1440) {
          throw new ValidationError('scraperIntervalMinutes must be between 1 and 1440');
        }
        runtimeConfig.scraperIntervalMinutes = updates.scraperIntervalMinutes;
      }

      // Return updated config
      return reply.status(200).send({
        success: true,
        data: {
          ...runtimeConfig,
          message: 'Configuration updated successfully',
        },
      });
    } catch (error: any) {
      if (error.issues) {
        // Zod validation error
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid configuration',
            details: error.issues,
            statusCode: 422,
          },
        });
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw error;
    }
  });
};

export default configRoute;
export { runtimeConfig };
