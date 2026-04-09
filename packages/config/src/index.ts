import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define config schema with Zod
const ConfigSchema = z.object({
  // Database
  databaseUrl: z.string().url(),

  // Redis
  redisUrl: z.string().url(),

  // Facebook Session
  fbSessionPath: z.string().default('./session/fb_session.json'),
  sessionEncryptKey: z.string().min(32, 'Session encrypt key must be at least 32 characters'),

  // Scraper
  targetUrl: z.string().url().default('https://www.jakartanotebook.com/category/laptop'),
  scraperIntervalMinutes: z.number().int().min(1).max(1440).default(20),

  // Product Processing
  priceMarkupPercent: z.number().int().min(0).max(200).default(25),
  minPrice: z.number().int().min(0).default(0),
  maxPrice: z.number().int().min(0).default(50000000),
  blacklistKeywords: z.string().transform((val) => val.split(',').map(k => k.trim()).filter(Boolean)),

  // Posting
  maxPostPerDay: z.number().int().min(1).max(50).default(8),
  postDelaySeconds: z.number().int().min(60).default(300),

  // Watermark
  watermarkText: z.string().default('TokoGue.id'),
  watermarkPosition: z.enum(['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right']).default('bottom-right'),
  watermarkOpacity: z.number().min(0).max(1).default(0.7),
  watermarkFontSize: z.number().int().min(10).max(100).default(40),

  // API
  port: z.coerce.number().int().min(1).max(65535).default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  corsOrigins: z.string().default('http://localhost:3000'),

  // Next.js
  nextPublicApiUrl: z.string().url().default('http://localhost:3001'),

  // Telegram (Optional)
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
});

// Parse and validate environment variables
export const config = ConfigSchema.parse({
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  fbSessionPath: process.env.FB_SESSION_PATH,
  sessionEncryptKey: process.env.SESSION_ENCRYPT_KEY || 'default-32-byte-encryption-key-change-me',
  targetUrl: process.env.TARGET_URL,
  scraperIntervalMinutes: parseInt(process.env.SCRAPER_INTERVAL_MINUTES || '20'),
  priceMarkupPercent: parseInt(process.env.PRICE_MARKUP_PERCENT || '25'),
  minPrice: parseInt(process.env.MIN_PRICE || '0'),
  maxPrice: parseInt(process.env.MAX_PRICE || '50000000'),
  blacklistKeywords: process.env.BLACKLIST_KEYWORDS || '',
  maxPostPerDay: parseInt(process.env.MAX_POST_PER_DAY || '8'),
  postDelaySeconds: parseInt(process.env.POST_DELAY_SECONDS || '300'),
  watermarkText: process.env.WATERMARK_TEXT || 'TokoGue.id',
  watermarkPosition: process.env.WATERMARK_POSITION || 'bottom-right',
  watermarkOpacity: parseFloat(process.env.WATERMARK_OPACITY || '0.7'),
  watermarkFontSize: parseInt(process.env.WATERMARK_FONT_SIZE || '40'),
  port: process.env.PORT || '3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:3000',
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
});

// Export types
export type Config = z.infer<typeof ConfigSchema>;

// Helper to check if Telegram is configured
export const isTelegramConfigured = () => {
  return !!config.telegramBotToken && !!config.telegramChatId;
};

// Helper to check if running in production
export const isProduction = () => {
  return config.nodeEnv === 'production';
};

// Helper to check if running in development
export const isDevelopment = () => {
  return config.nodeEnv === 'development';
};

export default config;
