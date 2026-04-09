import { PrismaClient } from '@prisma/client';

// PrismaClient singleton pattern for serverless environments
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Types
export type Product = {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  imageLocal: string | null;
  description: string | null;
  hash: string;
  status: 'DRAFT' | 'PROCESSING' | 'POSTED' | 'FAILED';
  postedAt: Date | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Job = {
  id: string;
  productId: string;
  status: string;
  log: string | null;
  attempt: number;
  createdAt: Date;
};
