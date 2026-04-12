import { ScraperProvider, RawListing, RawProductDetail } from '../interfaces/scraper-provider.interface';
import { BasePlaywrightProvider } from './base-playwright.provider';

export class TokopediaProvider extends BasePlaywrightProvider implements ScraperProvider {
  public readonly name = 'Tokopedia';
  public readonly baseUrl = 'https://www.tokopedia.com';

  async scrapeListing(url: string): Promise<RawListing[]> {
    const { browser, context, page } = await this.getBrowser();
    
    try {
      this.logger.info({ url }, 'Scraping Tokopedia listing page');
      
      // Tokopedia often detects automated browsers, so we use some extra caution
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await this.randomDelay(2000, 4000);
      await this.humanScroll(page);

      // Wait for product list container or items
      await page.waitForSelector('[data-testid="lstCL2ProductList"], [data-testid="divSRPContentProducts"]', { timeout: 15000 }).catch(() => {
        this.logger.warn('Product list selector not found, attempting fallback');
      });

      const listings = await page.evaluate(() => {
        // Tokopedia uses data-testid for many elements
        const items = document.querySelectorAll('[data-testid="master-product-card"], [data-testid="pcv3Container"]');
        const results: { title: string; productUrl: string }[] = [];

        items.forEach((item: Element) => {
          const titleEl = item.querySelector('[data-testid="spnSRPProdName"], [class*="pcv3-product-card__name"]');
          const linkEl = item.querySelector('a[href*="tokopedia.com"]');

          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || '',
              productUrl: (linkEl as HTMLAnchorElement).href,
            });
          }
        });

        return results;
      });

      this.logger.info({ count: listings.length }, 'Found listings on Tokopedia');
      return listings;
    } catch (error) {
      this.logger.error({ error, url }, 'Error scraping Tokopedia listing');
      return [];
    } finally {
      await this.cleanup(browser, context, page);
    }
  }

  async scrapeDetail(url: string): Promise<RawProductDetail | null> {
    const { browser, context, page } = await this.getBrowser();

    try {
      this.logger.info({ url }, 'Scraping Tokopedia detail page');
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

      if (!response || response.status() === 404) {
        return null;
      }

      await this.randomDelay(2000, 3000);
      await page.waitForSelector('[data-testid="lblPDPDetailProductName"]', { timeout: 10000 });

      const detail = await page.evaluate((sourceUrl: string) => {
        const titleEl = document.querySelector('[data-testid="lblPDPDetailProductName"]');
        const priceEl = document.querySelector('[data-testid="lblPDPDetailProductPrice"]');
        const descEl = document.querySelector('[data-testid="lblPDPDescriptionProdukt"]');
        const stockEl = document.querySelector('[data-testid="lblPDPDetailProductStock"]');
        
        // Images are often in a gallery
        const imgElements = document.querySelectorAll('[data-testid="PDPMainImage"], [data-testid="PDPImageThumbnail"] img');

        const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '0';
        const stockText = stockEl?.textContent?.toLowerCase() || '';
        
        const imageUrls: string[] = [];
        imgElements.forEach((img: Element, idx: number) => {
          if (idx < 5) {
            const src = (img as HTMLImageElement).src || img.getAttribute('data-src');
            if (src && !src.includes('base64')) {
                imageUrls.push(src);
            }
          }
        });

        // Deduplicate images
        const uniqueImages = [...new Set(imageUrls)];

        return {
          title: titleEl?.textContent?.trim() || '',
          price: parseInt(priceText) || 0,
          description: descEl?.textContent?.trim() || '',
          imageUrls: uniqueImages,
          inStock: !stockText.includes('habis') && !stockText.includes('kosong'),
          sourceUrl,
        };
      }, url);

      if (!detail.title || detail.price === 0) {
        return null;
      }

      return detail;
    } catch (error) {
      this.logger.error({ error, url }, 'Error scraping Tokopedia detail');
      return null;
    } finally {
      await this.cleanup(browser, context, page);
    }
  }
}
