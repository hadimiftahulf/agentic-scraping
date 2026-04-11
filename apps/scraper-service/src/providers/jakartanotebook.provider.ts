import { ScraperProvider, RawListing, RawProductDetail } from '../interfaces/scraper-provider.interface';
import { BasePlaywrightProvider } from './base-playwright.provider';

export class JakartaNotebookProvider extends BasePlaywrightProvider implements ScraperProvider {
  public readonly name = 'JakartaNotebook';
  public readonly baseUrl = 'https://www.jakartanotebook.com';

  async scrapeListing(url: string): Promise<RawListing[]> {
    const { browser, context, page } = await this.getBrowser();
    
    try {
      this.logger.info({ url }, 'Scraping listing page');
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('article, .product-item, .card', { timeout: 10000 });

      const listings = await page.evaluate(() => {
        const items = document.querySelectorAll('article, .product-item, .card');
        const results: { title: string; productUrl: string }[] = [];

        items.forEach((item: Element) => {
          const titleEl = item.querySelector('h3, .title, .product-title');
          const linkEl = item.querySelector('a[href]');

          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || '',
              productUrl: (linkEl as HTMLAnchorElement).href,
            });
          }
        });

        return results;
      });

      return listings;
    } finally {
      await this.cleanup(browser, context, page);
    }
  }

  async scrapeDetail(url: string): Promise<RawProductDetail | null> {
    const { browser, context, page } = await this.getBrowser();

    try {
      this.logger.info({ url }, 'Scraping detail page');
      const response = await page.goto(url, { waitUntil: 'networkidle' });

      if (!response || response.status() === 404) {
        return null;
      }

      await page.waitForSelector('h1, .product-title, .title', { timeout: 10000 });

      const detail = await page.evaluate((sourceUrl: string) => {
        const titleEl = document.querySelector('h1, .product-title, .title');
        const priceEl = document.querySelector('.price, [class*="price"], .price-display');
        const descEl = document.querySelector('.description, [class*="desc"], #product-desc');
        const stockEl = document.querySelector('[class*="stock"], .availability, .stock-status');
        const imgElements = document.querySelectorAll('.product-gallery img, .product-images img, .main-image img');

        const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '0';
        const stockText = stockEl?.textContent?.toLowerCase() || '';
        
        const imageUrls: string[] = [];
        imgElements.forEach((img: Element, idx: number) => {
          if (idx < 5) {
            const src = (img as HTMLImageElement).src || img.getAttribute('data-src');
            if (src) imageUrls.push(src);
          }
        });

        return {
          title: titleEl?.textContent?.trim() || '',
          price: parseInt(priceText) || 0,
          description: descEl?.textContent?.trim() || '',
          imageUrls,
          inStock: !stockText.includes('habis') && !stockText.includes('out of stock'),
          sourceUrl,
        };
      }, url);

      if (!detail.title || detail.price === 0) {
        return null;
      }

      return detail;
    } finally {
      await this.cleanup(browser, context, page);
    }
  }
}
