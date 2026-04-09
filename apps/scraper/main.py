"""Main entry point for scraper service."""
import asyncio
import signal
import logging
import sys
import os
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import structlog

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.config import config
from src.db import db
from src.scraper import scrape_listing, scrape_detail
from src.processor import process_product, process_product_image


# Configure structured logging
logging.basicConfig(
    format='%(message)s',
    level=getattr(logging, config.LOG_LEVEL, logging.INFO)
)

logger = structlog.get_logger()


class ScraperOrchestrator:
    """Orchestrates the scraping process."""

    def __init__(self):
        """Initialize orchestrator."""
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    async def run_scraping_cycle(self):
        """Run one complete scraping cycle."""
        try:
            logger.info("Scraping cycle started", event="scrape_start")

            # Step 1: Scrape product listings
            logger.info("Step 1: Scraping product listings")
            listings = await scrape_listing(config.TARGET_URL)

            if not listings:
                logger.warning("No products found in listing")
                return

            logger.info(f"Found {len(listings)} products in listing")

            # Step 2: For each listing, scrape details
            success_count = 0
            failed_count = 0

            for i, listing in enumerate(listings, 1):
                try:
                    product_url = listing.get('product_url')

                    if not product_url:
                        logger.warning(f"Listing {i} has no URL, skipping")
                        failed_count += 1
                        continue

                    logger.info(f"Processing product {i}/{len(listings)}: {listing.get('title', 'Unknown')}")

                    # Scrape detail
                    detail = await scrape_detail(product_url)

                    if not detail:
                        logger.warning(f"Failed to scrape detail for {product_url}")
                        failed_count += 1
                        continue

                    # Skip if out of stock
                    if not detail.get('in_stock', True):
                        logger.info(f"Product out of stock, skipping: {detail.get('title')}")
                        continue

                    # Process data (markup, hash, normalize)
                    processed = process_product(detail)

                    if not processed:
                        logger.warning(f"Failed to process product: {detail.get('title')}")
                        continue

                    # Process image
                    image_urls = detail.get('image_urls', [])
                    if image_urls:
                        image_url = image_urls[0]
                        processed['image_local'] = await asyncio.to_thread(
                            process_product_image,
                            processed['id'],
                            image_url
                        )

                        if processed['image_local']:
                            logger.info(f"Image processed: {processed['image_local']}")
                        else:
                            logger.warning(f"Failed to process image for {processed['title']}")

                    # Upsert to database
                    success = db.upsert_product(processed)

                    if success:
                        success_count += 1
                    else:
                        logger.error(f"Failed to save to database: {processed['title']}")
                        failed_count += 1

                    # Random delay between products (2-5 seconds)
                    import random
                    await asyncio.sleep(random.uniform(2, 5))

                except Exception as e:
                    logger.error(f"Error processing product {i}: {e}", exc_info=True)
                    failed_count += 1

            # Summary
            logger.info(
                "Scraping cycle completed",
                event="scrape_complete",
                total=len(listings),
                success=success_count,
                failed=failed_count
            )

            # Get total products in database
            total_products = db.get_products_count()
            logger.info(f"Total products in database: {total_products}")

        except Exception as e:
            logger.error(f"Error in scraping cycle: {e}", exc_info=True)

    async def random_delay(self, min_seconds: int, max_seconds: int):
        """Sleep for a random duration."""
        import random
        delay = random.uniform(min_seconds, max_seconds)
        await asyncio.sleep(delay)

    def setup_scheduler(self):
        """Setup APScheduler for recurring scraping."""
        # Add job
        self.scheduler.add_job(
            self.run_scraping_cycle,
            IntervalTrigger(minutes=config.SCRAPER_INTERVAL_MINUTES),
            id='scrape_job',
            name='Scrape Products',
            replace_existing=True
        )

        logger.info(
            f"Scheduler configured: every {config.SCRAPER_INTERVAL_MINUTES} minutes"
        )

    def shutdown(self, signum=None, frame=None):
        """Graceful shutdown handler."""
        logger.info("Shutting down scraper...", event="shutdown")

        self.is_running = False

        # Stop scheduler
        try:
            self.scheduler.shutdown(wait=False)
        except:
            pass

        # Close database
        try:
            db.close()
        except:
            pass

        logger.info("Scraper stopped")

    async def run(self):
        """Run the scraper."""
        self.is_running = True

        # Setup signal handlers
        signal.signal(signal.SIGTERM, lambda s, f: self.shutdown(s, f))
        signal.signal(signal.SIGINT, lambda s, f: self.shutdown(s, f))

        # Setup scheduler
        self.setup_scheduler()

        # Run immediately on startup
        logger.info("Starting initial scraping cycle")
        await self.run_scraping_cycle()

        # Start scheduler
        self.scheduler.start()

        logger.info(
            f"Scraper running. Next scrape in {config.SCRAPER_INTERVAL_MINUTES} minutes",
            event="running"
        )

        # Keep running
        try:
            while self.is_running:
                await asyncio.sleep(60)
        except Exception as e:
            logger.error(f"Error in main loop: {e}", exc_info=True)
            self.shutdown()


async def main():
    """Main entry point."""
    orchestrator = ScraperOrchestrator()
    await orchestrator.run()


if __name__ == '__main__':
    # Check database connection
    try:
        # Test connection
        conn = db.get_connection()
        db.release_connection(conn)
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Cannot connect to database: {e}", event="db_error")
        sys.exit(1)

    # Run scraper
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
