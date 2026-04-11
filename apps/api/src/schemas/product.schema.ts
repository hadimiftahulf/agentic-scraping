import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  price: z.number(),
  imageUrl: z.string().nullable(),
  imageLocal: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(['DRAFT', 'PROCESSING', 'POSTED', 'FAILED']),
  postedAt: z.date().nullable(),
  sourceUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export const CreateProductSchema = z.object({
  title: z.string().min(1).max(200),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  sourceUrl: z.string().url().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const GetProductsQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSING', 'POSTED', 'FAILED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const GetConfigSchema = z.object({
  markupPercent: z.number().min(0).max(200).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  maxPostPerDay: z.number().min(1).max(50).optional(),
  blacklistKeywords: z.array(z.string()).optional(),
  scraperIntervalMinutes: z.number().min(1).max(1440).optional(),
});

export const BatchPostSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(10),
  delaySeconds: z.number().min(10).max(3600).optional().default(300),
});

export const PostJobDataSchema = z.object({
  productId: z.string().uuid(),
  attempt: z.number().min(0).default(0),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type GetProductsQuery = z.infer<typeof GetProductsQuerySchema>;
export type GetConfig = z.infer<typeof GetConfigSchema>;
export type BatchPost = z.infer<typeof BatchPostSchema>;
export type PostJobData = z.infer<typeof PostJobDataSchema>;
