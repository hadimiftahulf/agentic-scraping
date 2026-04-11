import { FastifyPluginAsync } from "fastify";
import { prisma } from "@bot/db";
import Redis from "ioredis";
import { createLogger } from "pino";

const logger = createLogger();

const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

interface HealthCheck {
  status: "healthy" | "unhealthy";
  checks: {
    database: { status: "ok" | "error"; latencyMs?: number; error?: string };
    redis: { status: "ok" | "error"; latencyMs?: number; error?: string };
    queue?: { status: "ok" | "error"; pendingJobs?: number; error?: string };
  };
  uptime: number;
  version: string;
  timestamp: string;
}

const healthRoute: FastifyPluginAsync = async (fastify, options) => {
  fastify.get("/health", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      reply.send({ status: "ok" });
    } catch (error) {
      logger.error({ error }, "Health check failed");
      reply
        .status(503)
        .send({ status: "error", message: "Service unavailable" });
    }
  });

  fastify.get("/health/detailed", async (request, reply) => {
    const health: HealthCheck = {
      status: "healthy",
      checks: {
        database: { status: "ok" },
        redis: { status: "ok" },
        queue: { status: "ok", pendingJobs: 0 },
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
    };

    let hasError = false;

    try {
      const dbStart = process.hrtime();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = process.hrtime(dbStart);
      const dbLatency = dbEnd[0] * 1000 + dbEnd[1] / 1000000;
      health.checks.database = {
        status: "ok",
        latencyMs: Math.round(dbLatency),
      };
    } catch (error) {
      hasError = true;
      health.checks.database = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      logger.error({ error }, "Database health check failed");
    }

    try {
      const redisStart = process.hrtime();
      await redis.ping();
      const redisEnd = process.hrtime(redisStart);
      const redisLatency = redisEnd[0] * 1000 + redisEnd[1] / 1000000;
      health.checks.redis = {
        status: "ok",
        latencyMs: Math.round(redisLatency),
      };
    } catch (error) {
      hasError = true;
      health.checks.redis = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      logger.error({ error }, "Redis health check failed");
    }

    try {
      const pendingJobs = await redis.llen("bull:post-product:wait");
      health.checks.queue = {
        status: "ok",
        pendingJobs,
      };
    } catch (error) {
      hasError = true;
      health.checks.queue = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      logger.error({ error }, "Queue health check failed");
    }

    if (hasError) {
      health.status = "unhealthy";
    }

    const statusCode = hasError ? 503 : 200;
    reply.status(statusCode).send(health);
  });
};

export default healthRoute;
