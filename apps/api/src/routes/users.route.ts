import { FastifyPluginAsync } from 'fastify';
import { UserService } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { UserController } from '../controllers/user.controller';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';

const usersRoute: FastifyPluginAsync = async (fastify) => {
  const userRepository = new UserRepository(fastify.db);
  const userService = new UserService(userRepository, fastify.db);
  const userController = new UserController(userService);

  /**
   * GET /users
   */
  fastify.get('/users', {
    onRequest: [fastify.authenticate],
    handler: (request, reply) => userController.index(request, reply),
  });

  /**
   * GET /users/:id
   */
  fastify.get('/users/:id', {
    onRequest: [fastify.authenticate],
    handler: (request, reply) => userController.show(request, reply),
  });

  /**
   * POST /users
   */
  fastify.post('/users', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        CreateUserSchema.parse(request.body);
        return userController.store(request, reply);
      } catch (error: any) {
        if (error.issues) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: error.issues,
              statusCode: 400,
            },
          });
        }
        throw error;
      }
    },
  });

  /**
   * PATCH /users/:id
   */
  fastify.patch('/users/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        UpdateUserSchema.parse(request.body);
        return userController.update(request, reply);
      } catch (error: any) {
        if (error.issues) {
          return reply.status(400).send({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: error.issues,
              statusCode: 400,
            },
          });
        }
        throw error;
      }
    },
  });

  /**
   * POST /users/:id/suspend
   */
  fastify.post('/users/:id/suspend', {
    onRequest: [fastify.authenticate],
    handler: (request, reply) => userController.suspend(request, reply),
  });

  /**
   * POST /users/:id/activate
   */
  fastify.post('/users/:id/activate', {
    onRequest: [fastify.authenticate],
    handler: (request, reply) => userController.activate(request, reply),
  });

  /**
   * DELETE /users/:id
   */
  fastify.delete('/users/:id', {
    onRequest: [fastify.authenticate],
    handler: (request, reply) => userController.destroy(request, reply),
  });
};

export default usersRoute;
