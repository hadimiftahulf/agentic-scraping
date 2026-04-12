import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JakartaNotebookProvider } from '../providers/jakartanotebook.provider';

// Mock playwright
vi.mock('playwright', () => {
  const page = {
    setDefaultTimeout: vi.fn(),
    evaluate: vi.fn(),
    goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    waitForSelector: vi.fn().mockResolvedValue(true),
    close: vi.fn(),
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

describe('JakartaNotebookProvider', () => {
  let provider: JakartaNotebookProvider;

  beforeEach(() => {
    provider = new JakartaNotebookProvider();
    vi.clearAllMocks();
  });

  it('should have the correct name and baseUrl', () => {
    expect(provider.name).toBe('JakartaNotebook');
    expect(provider.baseUrl).toBe('https://www.jakartanotebook.com');
  });

  it('should call page.goto with the listing URL', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    // We need to inject the mock behavior for page.evaluate
    mockPage.evaluate = vi.fn().mockImplementation((fn: any) => {
        // Mock scroll height
        if (typeof fn === 'string' && fn === 'document.body.scrollHeight') return 1000;
        // Mock listings
        if (typeof fn === 'function') {
            return [
                { title: 'Product 1', productUrl: 'https://example.com/p1' },
                { title: 'Product 2', productUrl: 'https://example.com/p2' }
            ];
        }
        return null;
    });

    // Mock getBrowser to return our mocks
    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const listings = await provider.scrapeListing('https://example.com/listing');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/listing', { waitUntil: 'networkidle' });
    expect(listings).toHaveLength(2);
    expect(listings[0].title).toBe('Product 1');
  });

  it('should scrape product details correctly', async () => {
    const { chromium } = await import('playwright');
    const mockBrowser = await chromium.launch();
    const mockContext = await mockBrowser.newContext();
    const mockPage = await mockContext.newPage();
    
    mockPage.evaluate = vi.fn().mockResolvedValue({
        title: 'Mock Product',
        price: 100000,
        description: 'Mock Description',
        imageUrls: ['https://example.com/img.jpg'],
        inStock: true,
        sourceUrl: 'https://example.com/p1'
    });

    vi.spyOn(provider as any, 'getBrowser').mockResolvedValue({
        browser: mockBrowser,
        context: mockContext,
        page: mockPage
    });

    const detail = await provider.scrapeDetail('https://example.com/p1');
    
    expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/p1', { waitUntil: 'networkidle' });
    expect(detail).not.toBeNull();
    expect(detail?.title).toBe('Mock Product');
    expect(detail?.price).toBe(100000);
  });
});
