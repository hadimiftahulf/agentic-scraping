import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config before other imports
vi.mock('@bot/config', () => ({
  config: {
    priceMarkupPercent: 25,
    databaseUrl: 'postgresql://user:pass@localhost:5432/db',
    redisUrl: 'redis://localhost:6379',
  },
  isProduction: () => false,
  isDevelopment: () => true,
}));

import { ScraperOrchestrator } from '../orchestrator';
import { PrismaClient } from '@bot/db';
import { ScraperProvider } from '../interfaces/scraper-provider.interface';

describe('ScraperOrchestrator', () => {
  let orchestrator: ScraperOrchestrator;
  let mockDb: any;
  let mockProvider: any;

  beforeEach(() => {
    mockDb = {
      product: {
        upsert: vi.fn().mockResolvedValue({ id: '1' }),
        update: vi.fn().mockResolvedValue({ id: '1' }),
      },
    };

    mockProvider = {
      name: 'TestProvider',
      scrapeListing: vi.fn().mockResolvedValue([
        { title: 'Product 1', productUrl: 'https://example.com/p1' }
      ]),
      scrapeDetail: vi.fn().mockResolvedValue({
        title: 'Product 1',
        price: 100000,
        description: 'Desc',
        imageUrls: ['https://example.com/img.jpg'],
        inStock: true,
        sourceUrl: 'https://example.com/p1'
      }),
    };

    orchestrator = new ScraperOrchestrator(mockDb as unknown as PrismaClient, mockProvider as unknown as ScraperProvider);
    vi.clearAllMocks();
  });

  it('should run a complete scraping cycle', async () => {
    await orchestrator.runCycle('https://example.com/target');

    expect(mockProvider.scrapeListing).toHaveBeenCalledWith('https://example.com/target');
    expect(mockProvider.scrapeDetail).toHaveBeenCalledWith('https://example.com/p1');
    expect(mockDb.product.upsert).toHaveBeenCalled();
  });

  it('should skip products that are out of stock', async () => {
    mockProvider.scrapeDetail.mockResolvedValueOnce({
      title: 'Out of Stock Product',
      price: 100000,
      description: 'Desc',
      imageUrls: [],
      inStock: false,
      sourceUrl: 'https://example.com/p1'
    });

    await orchestrator.runCycle('https://example.com/target');

    expect(mockDb.product.upsert).not.toHaveBeenCalled();
  });
});
