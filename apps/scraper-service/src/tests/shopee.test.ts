import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopeeProvider } from '../providers/shopee.provider';

// Mock playwright
vi.mock('playwright', () => {
  const page = {
    setDefaultTimeout: vi.fn(),
    evaluate: vi.fn(),
    goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    waitForSelector: vi.fn().mockResolvedValue(true),
    close: vi.fn(),
    title: vi.fn().mockResolvedValue('Shopee'),
  };
  const context = {
    addInitScript: vi.fn(),
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn(),
  };
  const browser = {
    newContext: vi.fn().mockResolvedValue(context),
    close: vi.fn(),
  };
  return {
    chromium: {
      launch: vi.fn().mockResolvedValue(browser),
    },
  };
});

describe('ShopeeProvider', () => {
  let provider: ShopeeProvider;

  beforeEach(() => {
    provider = new ShopeeProvider();
    // Mock delays and scrolls to speed up tests
    vi.spyOn(provider as any, 'randomDelay').mockResolvedValue(undefined);
    vi.spyOn(provider as any, 'humanScroll').mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('should have the correct name and baseUrl', () => {
    expect(provider.name).toBe('Shopee');
    expect(provider.baseUrl).toBe('https://shopee.co.id');
  });

  it('should call page.goto with the listing URL', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.evaluate = vi.fn().mockImplementation((fn: any) => {
        if (typeof fn === 'function') {
            return [
                { title: 'Shopee Product', productUrl: 'https://shopee.co.id/p1' }
            ];
        }
        return null;
    });

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const listings = await provider.scrapeListing('https://shopee.co.id/search?keyword=test');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://shopee.co.id/search?keyword=test', expect.any(Object));
    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe('Shopee Product');
  });

  it('should scrape product details correctly', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.evaluate = vi.fn().mockResolvedValue({
        title: 'Shopee Detail',
        price: 75000,
        description: 'Shopee Desc',
        imageUrls: ['https://shopee.co.id/img.jpg'],
        inStock: true,
        sourceUrl: 'https://shopee.co.id/p1'
    });

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const detail = await provider.scrapeDetail('https://shopee.co.id/p1');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://shopee.co.id/p1', expect.any(Object));
    expect(detail?.title).toBe('Shopee Detail');
    expect(detail?.price).toBe(75000);
  });

  it('should return null if bot detection triggered', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.title = vi.fn().mockResolvedValue('Robot Verification');

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const detail = await provider.scrapeDetail('https://shopee.co.id/p1');
    expect(detail).toBeNull();
  });
});
