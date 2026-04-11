import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service';
import { 
  LoginSchema, 
  RegisterSchema, 
  ActivateAccountSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema
} from '../schemas/auth.schema';
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

  /**
   * POST /auth/activate
   */
  fastify.post('/auth/activate', {
    schema: {
      body: ActivateAccountSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await authService.activateAccount(data.attributes.token);
      
      reply.status(200).send({
        meta: { message: "Account activated successfully." }
      });
    },
  });

  /**
   * POST /auth/change-password
   */
  fastify.post('/auth/change-password', {
    onRequest: [fastify.authenticate],
    schema: {
      body: ChangePasswordSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await authService.changePassword(
        (request.user as any).sub,
        data.attributes.current_password,
        data.attributes.new_password
      );
      
      reply.status(204).send();
    },
  });

  /**
   * POST /auth/forgot-password
   */
  fastify.post('/auth/forgot-password', {
    schema: {
      body: ForgotPasswordSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await authService.forgotPassword(data.attributes.email);
      
      reply.status(202).send({
        meta: { message: "If the email exists, a reset link has been sent." },
        data: null
      });
    },
  });

  /**
   * POST /auth/reset-password
   */
  fastify.post('/auth/reset-password', {
    schema: {
      body: ResetPasswordSchema,
    },
    handler: async (request, reply) => {
      const { data } = request.body as any;
      await authService.resetPassword(
        data.attributes.token,
        data.attributes.new_password
      );
      
      reply.status(200).send({
        meta: { message: "Password updated successfully." },
        data: null
      });
    },
  });
};

export default authRoute;
