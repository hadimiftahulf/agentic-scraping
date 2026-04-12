import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock config before other imports
vi.mock('@bot/config', () => ({
  config: {
    priceMarkupPercent: 25,
    databaseUrl: 'postgresql://user:pass@localhost:5432/db',
    redisUrl: 'redis://localhost:6379',
    corsOrigins: 'http://localhost:3000',
    port: 3001,
    nodeEnv: 'test',
  },
  default: {
    priceMarkupPercent: 25,
    databaseUrl: 'postgresql://user:pass@localhost:5432/db',
    redisUrl: 'redis://localhost:6379',
    corsOrigins: 'http://localhost:3000',
    port: 3001,
    nodeEnv: 'test',
  },
  isProduction: () => false,
  isDevelopment: () => true,
}));

import { app } from '../src/app';
import jwtPlugin from '../src/plugins/jwt.plugin';
import usersRoute from '../src/routes/users.route';

// Mock DB
const mockDb = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  role: {
    findFirst: vi.fn(),
  },
};

describe('User Routes', () => {
  let fastify = app;

  beforeEach(async () => {
    // Manually register dependencies for testing
    if (!fastify.hasDecorator('db')) {
        fastify.decorate('db', mockDb);
    }
    
    if (!fastify.hasDecorator('authenticate')) {
        await fastify.register(jwtPlugin);
    }

    // We might need to register usersRoute if not already registered
    // but usually app is a singleton in these tests.
    // In index.ts it's registered with prefix /api/v1
    try {
        await fastify.register(usersRoute, { prefix: '/api/v1' });
    } catch (e) {
        // already registered or error
    }

    await fastify.ready();
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/users',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return users when authenticated', async () => {
      const token = fastify.jwt.sign({ sub: 'user-id' });
      
      mockDb.user.findMany.mockResolvedValue([]);
      mockDb.user.count.mockResolvedValue(0);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toEqual([]);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a user', async () => {
      const token = fastify.jwt.sign({ sub: 'admin-id' });
      const userData = {
        data: {
          type: 'users',
          attributes: {
            email: 'test@example.com',
            full_name: 'Test User',
            password: 'password123',
          },
        },
      };

      mockDb.role.findFirst.mockResolvedValue({ id: 'role-id', name: 'EDITOR' });
      mockDb.user.create.mockResolvedValue({
        id: 'new-id',
        email: 'test@example.com',
        fullName: 'Test User',
        status: 'PENDING_ACTIVATION',
        roleId: 'role-id',
        role: { id: 'role-id', name: 'EDITOR' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/users',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: userData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.data.attributes.email).toBe('test@example.com');
    });

    it('should validate password length', async () => {
        const token = fastify.jwt.sign({ sub: 'admin-id' });
        const userData = {
          data: {
            type: 'users',
            attributes: {
              email: 'test@example.com',
              full_name: 'Test User',
              password: '123', // too short
            },
          },
        };
  
        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/users',
          headers: {
            authorization: `Bearer ${token}`,
          },
          payload: userData,
        });
  
        expect(response.statusCode).toBe(400); // Validation error
      });
  });

  describe('POST /api/v1/users/:id/suspend', () => {
    it('should suspend a user', async () => {
      const token = fastify.jwt.sign({ sub: 'admin-id' });
      
      mockDb.user.update.mockResolvedValue({
        id: 'user-id',
        status: 'SUSPENDED',
        role: { name: 'EDITOR' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/users/user-id/suspend',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.attributes.status).toBe('SUSPENDED');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return a user by ID', async () => {
      const token = fastify.jwt.sign({ sub: 'user-id' });
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        status: 'ACTIVE',
        role: { name: 'EDITOR' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/users/user-id',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.id).toBe('user-id');
    });

    it('should return 404 if user not found', async () => {
      const token = fastify.jwt.sign({ sub: 'user-id' });
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/users/non-existent',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update a user', async () => {
      const token = fastify.jwt.sign({ sub: 'admin-id' });
      const userId = '11111111-1111-1111-1111-111111111111';
      const updateData = {
        data: {
          type: 'users',
          id: userId,
          attributes: {
            full_name: 'Updated Name',
          },
        },
      };

      mockDb.user.update.mockResolvedValue({
        id: userId,
        fullName: 'Updated Name',
        email: 'test@example.com',
        status: 'ACTIVE',
        role: { name: 'EDITOR' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await fastify.inject({
        method: 'PATCH',
        url: `/api/v1/users/${userId}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.attributes.full_name).toBe('Updated Name');
    });
  });

  describe('POST /api/v1/users/:id/activate', () => {
    it('should activate a user', async () => {
      const token = fastify.jwt.sign({ sub: 'admin-id' });
      
      mockDb.user.update.mockResolvedValue({
        id: 'user-id',
        status: 'ACTIVE',
        role: { name: 'EDITOR' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/users/user-id/activate',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.attributes.status).toBe('ACTIVE');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete a user', async () => {
      const token = fastify.jwt.sign({ sub: 'admin-id' });
      
      mockDb.user.update.mockResolvedValue({ id: 'user-id', deletedAt: new Date() });

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/v1/users/user-id',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(204);
    });
  });
});
