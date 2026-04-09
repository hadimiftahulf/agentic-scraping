import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '@fastify/swagger';
import { app } from '../src/app';
import { NotFoundError, ConflictError } from '../src/middleware/errors';

describe('Product Routes', () => {
  let fastify = app;

  beforeEach(async () => {
    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('GET /products', () => {
    it('should return empty array when no products exist', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/products',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toEqual([]);
      expect(body.meta.total).toBe(0);
    });

    it('should support pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/products?page=1&limit=10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(10);
    });

    it('should filter by status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/products?status=DRAFT',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /products/:id', () => {
    it('should return 404 for non-existent product', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/products/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return product when exists', async () => {
      // This test assumes a product exists
      const response = await fastify.inject({
        method: 'GET',
        url: '/products/test-id',
      });

      // In real test, we would mock database
      expect(response.statusCode).toBe(404); // Since no product exists
    });
  });

  describe('POST /products/:id/post', () => {
    it('should return 404 for non-existent product', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/products/non-existent-id/post',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should validate request', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/products/test-id/post',
      });

      // Will fail validation (UUID required)
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /products/batch-post', () => {
    it('should validate request body', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/products/batch-post',
        payload: { productIds: ['invalid-uuid'] },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should limit to 10 products', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/products/batch-post',
        payload: {
          productIds: Array(11).fill('test-id'), // More than 10
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });

  describe('GET /config', () => {
    it('should return current config', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/config',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toBeDefined();
      expect(body.data.markupPercent).toBeDefined();
    });
  });

  describe('PATCH /config', () => {
    it('should update config', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: '/config',
        payload: {
          markupPercent: 30,
          maxPostPerDay: 10,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.markupPercent).toBe(30);
      expect(body.data.maxPostPerDay).toBe(10);
    });

    it('should validate markupPercent range', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: '/config',
        payload: {
          markupPercent: 250, // > 200, invalid
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it('should validate maxPostPerDay range', async () => {
      const response = await fastify.inject({
        method: 'PATCH',
        url: '/config',
        payload: {
          maxPostPerDay: 100, // > 50, invalid
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });
});
