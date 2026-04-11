import { FastifyPluginAsync } from 'fastify';
import { UserService } from '../services/user.service';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';
import { transformUser, transformUsers } from '../lib/json-api';

const usersRoute: FastifyPluginAsync = async (fastify) => {
  const userService = new UserService(fastify.db);

  /**
   * GET /users
   */
  fastify.get('/users', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { status, roleId, page, limit } = request.query as any;
      const skip = (page - 1) * limit;
      
      const { users, totalCount } = await userService.list({
        status,
        roleId,
        skip,
        take: limit,
      });

      reply.send(transformUsers(users, { total_count: totalCount }));
    },
  });

  /**
   * GET /users/:id
   */
  fastify.get('/users/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const user = await userService.findById(id);
      
      if (!user) {
        reply.status(404).send({ error: 'User not found' });
        return;
      }

      reply.send({ data: transformUser(user) });
    },
  });

  /**
   * POST /users
   */
  fastify.post('/users', {
    onRequest: [fastify.authenticate],
    schema: {
      body: CreateUserSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      const user = await userService.create(data.attributes);
      
      reply.status(201).send({ data: transformUser(user) });
    },
  });

  /**
   * PATCH /users/:id
   */
  fastify.patch('/users/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      body: UpdateUserSchema,
    },
    handler: async (request, reply) => {
      const { id } = request.params as any;
      const { data } = request.body as any;
      
      const user = await userService.update(id, data.attributes);
      reply.send({ data: transformUser(user) });
    },
  });

  /**
   * DELETE /users/:id
   */
  fastify.delete('/users/:id', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as any;
      await userService.delete(id);
      reply.status(204).send();
    },
  });
};

export default usersRoute;
