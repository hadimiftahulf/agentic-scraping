import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokopediaProvider } from '../providers/tokopedia.provider';

// Mock playwright
vi.mock('playwright', () => {
  const page = {
    setDefaultTimeout: vi.fn(),
    evaluate: vi.fn(),
    goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    waitForSelector: vi.fn().mockResolvedValue(true),
    close: vi.fn(),
    title: vi.fn().mockResolvedValue('Tokopedia'),
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

describe('TokopediaProvider', () => {
  let provider: TokopediaProvider;

  beforeEach(() => {
    provider = new TokopediaProvider();
    // Mock delays and scrolls to speed up tests
    vi.spyOn(provider as any, 'randomDelay').mockResolvedValue(undefined);
    vi.spyOn(provider as any, 'humanScroll').mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('should have the correct name and baseUrl', () => {
    expect(provider.name).toBe('Tokopedia');
    expect(provider.baseUrl).toBe('https://www.tokopedia.com');
  });

  it('should call page.goto with the listing URL', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.evaluate = vi.fn().mockImplementation((fn: any) => {
        if (typeof fn === 'function') {
            return [
                { title: 'Tokopedia Product', productUrl: 'https://tokopedia.com/p1' }
            ];
        }
        return null;
    });

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const listings = await provider.scrapeListing('https://tokopedia.com/search?q=test');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://tokopedia.com/search?q=test', expect.any(Object));
    expect(listings).toHaveLength(1);
    expect(listings[0].title).toBe('Tokopedia Product');
  });

  it('should scrape product details correctly', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.evaluate = vi.fn().mockResolvedValue({
        title: 'Tokopedia Detail',
        price: 50000,
        description: 'Tokopedia Desc',
        imageUrls: ['https://tokopedia.com/img.jpg'],
        inStock: true,
        sourceUrl: 'https://tokopedia.com/p1'
    });

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const detail = await provider.scrapeDetail('https://tokopedia.com/p1');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://tokopedia.com/p1', expect.any(Object));
    expect(detail?.title).toBe('Tokopedia Detail');
    expect(detail?.price).toBe(50000);
  });
});
