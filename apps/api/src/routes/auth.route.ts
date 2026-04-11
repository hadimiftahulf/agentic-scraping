import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';
import { transformUser } from '../lib/json-api';

const authRoute: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify);

  /**
   * POST /auth/register
   */
  fastify.post('/auth/register', {
    schema: {
      body: RegisterSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      const user = await authService.register(data.attributes);
      
      reply.status(201).send({
        data: transformUser(user),
      });
    },
  });

  /**
   * POST /auth/login
   */
  fastify.post('/auth/login', {
    schema: {
      body: LoginSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      const session = await authService.login(data.attributes);

      reply.send({
        data: {
          type: 'auth_session',
          id: session.userId,
          attributes: {
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
            expires_in: session.expiresIn,
            token_type: 'Bearer',
          },
          links: {
            self: '/api/v1/auth/session',
          },
        },
      });
    },
  });

  /**
   * GET /auth/me
   */
  fastify.get('/auth/me', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = await authService.getProfile((request.user as any).sub);
      
      reply.send({
        data: transformUser(user),
      });
    },
  });

  /**
   * POST /auth/logout
   */
  fastify.post('/auth/logout', {
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      // In a real app, we might blacklist the token in Redis
      reply.status(204).send();
    },
  });
};

export default authRoute;
