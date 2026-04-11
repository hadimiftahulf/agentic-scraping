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
      await page.waitForSelector('article, .product-item, .card, a[class*="ProductCardWrapper"]', { timeout: 10000 });

      // Scroll to trigger lazy loading / pagination
      let previousHeight = 0;
      for (let i = 0; i < 5; i++) {
        previousHeight = await page.evaluate('document.body.scrollHeight') as number;
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await new Promise(r => setTimeout(r, 1000));
        const newHeight = await page.evaluate('document.body.scrollHeight') as number;
        if (newHeight === previousHeight) break;
      }

      const listings = await page.evaluate(() => {
        const items = document.querySelectorAll('article, .product-item, .card, a[class*="ProductCardWrapper"]');
        const results: { title: string; productUrl: string }[] = [];

        items.forEach((item: Element) => {
          const titleEl = item.querySelector('h3, .title, .product-title, span[class*="ProductCardWrapper"]');
          const linkEl = item.tagName.toLowerCase() === 'a' ? item : item.querySelector('a[href]');

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
        const priceEl = document.querySelector('.price, [class*="price"], .price-display, [class*="StyledPrice"]');
        const descEl = document.querySelector('.description, [class*="desc"], #product-desc, [class*="StyledOverview"]');
        const stockEl = document.querySelector('[class*="stock"], .availability, .stock-status, [class*="StyledStockInfo"]');
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
