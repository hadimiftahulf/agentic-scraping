import { ScraperProvider, RawListing, RawProductDetail } from '../interfaces/scraper-provider.interface';
import { BasePlaywrightProvider } from './base-playwright.provider';

export class ShopeeProvider extends BasePlaywrightProvider implements ScraperProvider {
  public readonly name = 'Shopee';
  public readonly baseUrl = 'https://shopee.co.id';

  async scrapeListing(url: string): Promise<RawListing[]> {
    const { browser, context, page } = await this.getBrowser();
    
    try {
      this.logger.info({ url }, 'Scraping Shopee listing page');
      
      // Shopee has very aggressive anti-bot. We need to be careful.
      await page.goto(url, { waitUntil: 'networkidle' });
      await this.randomDelay(3000, 6000);
      await this.humanScroll(page);

      // Shopee class names are often obfuscated or dynamic, using partial matches
      await page.waitForSelector('.shopee-search-item-result__item, [data-sqe="item"]', { timeout: 20000 }).catch(() => {
        this.logger.warn('Shopee item selector not found, attempting fallback');
      });

      const listings = await page.evaluate(() => {
        const items = document.querySelectorAll('.shopee-search-item-result__item, [data-sqe="item"]');
        const results: { title: string; productUrl: string }[] = [];

        items.forEach((item: Element) => {
          // Look for title in div with specific data-sqe or class
          const titleEl = item.querySelector('[data-sqe="name"], ._10Wbs-');
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

      this.logger.info({ count: listings.length }, 'Found listings on Shopee');
      return listings;
    } catch (error) {
      this.logger.error({ error, url }, 'Error scraping Shopee listing');
      return [];
    } finally {
      await this.cleanup(browser, context, page);
    }
  }

  async scrapeDetail(url: string): Promise<RawProductDetail | null> {
    const { browser, context, page } = await this.getBrowser();

    try {
      this.logger.info({ url }, 'Scraping Shopee detail page');
      const response = await page.goto(url, { waitUntil: 'networkidle' });

      if (!response || response.status() === 404) {
        return null;
      }

      await this.randomDelay(3000, 5000);
      
      // Check for captcha or blocking
      const pageTitle = await page.title();
      if (pageTitle.includes('Robot') || pageTitle.includes('Verification')) {
          this.logger.error('Shopee bot detection triggered');
          return null;
      }

      await page.waitForSelector('div[class*="_2r077X"], h1, ._3e_u3G', { timeout: 15000 });

      const detail = await page.evaluate((sourceUrl: string) => {
        // These selectors are highly dynamic on Shopee
        const titleEl = document.querySelector('div[class*="_2r077X"], h1, ._3e_u3G');
        const priceEl = document.querySelector('div[class*="_3n5NQx"], ._2v_unB, ._3c5v7a');
        const descEl = document.querySelector('div[class*="_2u0LOf"], ._29-vkv, .product-detail');
        const stockEl = document.querySelector('div[class*="_1F_ESpc"], ._1_2Abp');
        
        const imgElements = document.querySelectorAll('div[class*="_2xF9v_"] img, ._2G_o-G img');

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

        return {
          title: titleEl?.textContent?.trim() || '',
          price: parseInt(priceText) || 0,
          description: descEl?.textContent?.trim() || '',
          imageUrls: [...new Set(imageUrls)],
          inStock: !stockText.includes('habis') && !stockText.includes('0'),
          sourceUrl,
        };
      }, url);

      if (!detail.title || detail.price === 0) {
        return null;
      }

      return detail;
    } catch (error) {
      this.logger.error({ error, url }, 'Error scraping Shopee detail');
      return null;
    } finally {
      await this.cleanup(browser, context, page);
    }
  }
}
