/** @type {import('fastify').FastifyPlugin } */
import fp from 'fastify';
import {
  ProductSchema,
  GetProductsQuerySchema,
  BatchPostSchema,
  PostJobDataSchema,
} from '../schemas/product.schema';
import {
  NotFoundError,
  ConflictError,
} from '../middleware/errors';
import {
  ProductService,
} from '../services/product.service';
import { QUEUE_NAME } from '@bot/utils/src/queue';

const productsRoute: import('fastify').FastifyPlugin = async (fastify, options) => {
  const { db, redis } = fastify;

  /**
   * GET /products - List all products with pagination and filters
   */
  fastify.get('/products', async (request, reply) => {
    try {
      // Parse query parameters
      const query = GetProductsQuerySchema.parse(request.query as any);

      // Build where clause
      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      // Get total count
      const total = await db.product.count({ where });

      // Get products with pagination
      const skip = (query.page - 1) * query.limit;
      const products = await db.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      });

      // Return paginated response
      return {
        data: products.map(p => ProductSchema.parse(p)),
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / query.limit),
        },
      };
    } catch (error: any) {
      if (error.issues) {
        // Zod validation error
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
            statusCode: 422,
          },
        });
      }
      throw error;
    }
  });

  /**
   * GET /products/:id - Get product detail
   */
  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return ProductSchema.parse(product);
  });

  /**
   * POST /products/:id/post - Trigger posting for a single product
   */
  fastify.post('/products/:id/post', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Validate product exists and is eligible
      const product = await ProductService.validateProduct(id, db);

      if (!product) {
        if (product === null) {
          // Product not found
          throw new NotFoundError('Product not found');
        } else {
          // Product not eligible (already PROCESSING or POSTED)
          throw new ConflictError('Product is not eligible for posting');
        }
      }

      // Update status to PROCESSING
      await ProductService.updateStatusToProcessing(id, db);

      // Create job record in database
      await ProductService.createJobRecord(id, db);

      // Post job to queue
      const jobId = await ProductService.postProduct(id, fastify.queue);

      return reply.status(202).send({
        success: true,
        data: {
          jobId,
          message: 'Job queued successfully',
        },
      });
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw error;
    }
  });

  /**
   * POST /products/batch-post - Batch post multiple products
   */
  fastify.post('/products/batch-post', async (request, reply) => {
    try {
      // Parse request body
      const body = BatchPostSchema.parse(request.body);

      // Validate all products exist and are eligible
      const validProducts: string[] = [];
      const invalidProducts: string[] = [];

      for (const id of body.productIds) {
        const product = await ProductService.validateProduct(id, db);

        if (product) {
          validProducts.push(id);
        } else {
          invalidProducts.push(id);
        }
      }

      // Update status to PROCESSING for valid products
      for (const id of validProducts) {
        await ProductService.updateStatusToProcessing(id, db);
        await ProductService.createJobRecord(id, db);
      }

      // Post jobs to queue with staggered delays
      const jobIds = await ProductService.batchPostProducts(
        validProducts,
        fastify.queue,
        body.delaySeconds
      );

      return reply.status(202).send({
        success: true,
        data: {
          queued: validProducts.length,
          skipped: invalidProducts.length,
          jobIds,
          message: `Successfully queued ${validProducts.length} products`,
        },
      });
    } catch (error: any) {
      if (error.issues) {
        // Zod validation error
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues,
            statusCode: 422,
          },
        });
      }
      throw error;
    }
  });

  /**
   * GET /products/:id/jobs - Get job history for a product
   */
  fastify.get('/products/:id/jobs', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check product exists
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get jobs for this product
    const jobs = await db.job.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: jobs,
      total: jobs.length,
    };
  });
};

export default productsRoute;
