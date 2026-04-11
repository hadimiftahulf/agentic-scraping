import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import config from '@bot/config';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production',
    sign: {
      expiresIn: '1h',
    },
  });

  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});
