import { vi } from "vitest";

vi.mock("@bot/config", () => ({
  config: {
    databaseUrl: "postgresql://test:test@localhost:5432/testdb",
    redisUrl: "redis://localhost:6379",
    nodeEnv: "test",
    sessionEncryptionKey: "test-encryption-key-32-characters-long",
    fbSessionPath: "/tmp/test-session.json",
  },
}));

vi.mock("pino", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("ioredis", () => ({
  default: vi.fn(() => ({
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    quit: vi.fn(),
  })),
}));

vi.mock("@bot/db", () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    job: {
      create: vi.fn(),
    },
  },
}));
