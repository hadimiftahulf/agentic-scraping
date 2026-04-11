import { PrismaClient } from '@bot/db';
import pino from 'pino';
import { ScraperProvider } from './interfaces/scraper-provider.interface';
import { ImageProcessor } from './processors/image.processor';
import { generateHash, applyMarkup, normalizeTitle, sleep, randomDelay } from '@bot/utils';
import { config } from '@bot/config';

export class ScraperOrchestrator {
  private logger = pino({ name: 'ScraperOrchestrator' });
  private imageProcessor = new ImageProcessor();

  constructor(
    private db: PrismaClient,
    private provider: ScraperProvider
  ) {}

  /**
   * Runs a complete scraping cycle for the provider
   */
  async runCycle(targetUrl: string): Promise<void> {
    this.logger.info({ provider: this.provider.name, targetUrl }, 'Starting scraping cycle');

    try {
      // 1. Scrape listing
      const listings = await this.provider.scrapeListing(targetUrl);
      this.logger.info({ count: listings.length }, 'Found products in listing');

      let successCount = 0;
      let errorCount = 0;

      for (const listing of listings) {
        try {
          this.logger.debug({ product: listing.title }, 'Processing product');

          // 2. Scrape detail
          const detail = await this.provider.scrapeDetail(listing.productUrl);
          
          if (!detail) {
            this.logger.warn({ url: listing.productUrl }, 'Failed to scrape detail, skipping');
            errorCount++;
            continue;
          }

          if (!detail.inStock) {
            this.logger.info({ product: detail.title }, 'Product out of stock, skipping');
            continue;
          }

          // 3. Process and Normalize
          const normalizedTitle = normalizeTitle(detail.title);
          const markedUpPrice = applyMarkup(detail.price, config.priceMarkupPercent);
          const productHash = generateHash(normalizedTitle, detail.price);

          // 4. Upsert to DB (First pass to get ID if needed for image path)
          const product = await this.db.product.upsert({
            where: { hash: productHash },
            update: {
              title: normalizedTitle,
              price: markedUpPrice,
              imageUrl: detail.imageUrls[0] || null,
              description: detail.description,
              status: 'DRAFT',
              sourceUrl: detail.sourceUrl,
              updatedAt: new Date(),
            },
            create: {
              title: normalizedTitle,
              price: markedUpPrice,
              imageUrl: detail.imageUrls[0] || null,
              description: detail.description,
              hash: productHash,
              status: 'DRAFT',
              sourceUrl: detail.sourceUrl,
            },
          });

          // 5. Process Image if available
          if (detail.imageUrls.length > 0) {
            const processedImagePath = await this.imageProcessor.processProductImage(
              product.id,
              detail.imageUrls[0]
            );

            if (processedImagePath) {
              await this.db.product.update({
                where: { id: product.id },
                data: { imageLocal: processedImagePath },
              });
            }
          }

          successCount++;
          
          // Random delay between 2-5 seconds
          await randomDelay(2000, 5000);
        } catch (err) {
          this.logger.error({ err, url: listing.productUrl }, 'Error processing product');
          errorCount++;
        }
      }

      this.logger.info({
        provider: this.provider.name,
        total: listings.length,
        success: successCount,
        failed: errorCount
      }, 'Scraping cycle completed');

    } catch (err) {
      this.logger.error({ err }, 'Fatal error in scraping cycle');
    }
  }
}
