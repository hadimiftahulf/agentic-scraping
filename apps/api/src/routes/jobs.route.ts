/** @type {import('fastify').FastifyPlugin } */
import fp from 'fastify';
import { NotFoundError } from '../middleware/errors';

const jobsRoute: import('fastify').FastifyPlugin = async (fastify, options) => {
  const { db } = fastify;

  /**
   * GET /jobs - List all recent jobs
   */
  fastify.get('/jobs', async (request, reply) => {
    const query = request.query as any;

    // Build where clause
    const where: any = {};

    if (query.status) {
      where.status = query.status as string;
    }

    // Get jobs with pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      db.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  /**
   * GET /jobs/:id - Get job detail
   */
  fastify.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await db.job.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    return job;
  });
};

export default jobsRoute;
