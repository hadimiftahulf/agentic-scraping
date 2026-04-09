"""Product listing scraper for Jakartanotebook."""
import asyncio
import logging
import random
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from src.config import config

logger = logging.getLogger(__name__)


class ListingScraper:
    """Scrape product listings from Jakartanotebook."""

    def __init__(self, base_url: str):
        """
        Initialize scraper.

        Args:
            base_url: Base URL to scrape
        """
        self.base_url = base_url
        self.products: List[Dict] = []

    async def setup_browser(self) -> tuple[Browser, BrowserContext, Page]:
        """
        Setup browser with stealth configuration.

        Returns:
            Tuple of (browser, context, page)
        """
        playwright = await async_playwright().start()

        # Random viewport
        viewport_width = random.randint(1280, 1920)
        viewport_height = random.randint(720, 1080)

        # Launch browser
        browser = await playwright.chromium.launch(
            headless=config.HEADLESS,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        )

        # Create context with stealth settings
        context = await browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='id-ID',
            timezone_id='Asia/Jakarta',
        )

        # Override navigator.webdriver
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)

        page = await context.new_page()

        # Set default timeout
        page.set_default_timeout(30000)

        return browser, context, page

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    async def scrape_page(self, page: Page, url: str) -> List[Dict]:
        """
        Scrape a single page of product listings.

        Args:
            page: Playwright page object
            url: URL to scrape

        Returns:
            List of product dictionaries
        """
        try:
            logger.info(f"Navigating to: {url}")

            await page.goto(url, wait_until='networkidle', timeout=30000)

            # Wait for product listings to load
            await page.wait_for_selector('article, .product-item, .card', timeout=10000)

            # Extract product information
            # Note: Selectors need to be adjusted based on actual Jakartanotebook HTML structure
            products = await page.evaluate("""
                () => {
                    const products = [];
                    const items = document.querySelectorAll('article, .product-item, .card');

                    items.forEach(item => {
                        const titleEl = item.querySelector('h3, .title, .product-title');
                        const priceEl = item.querySelector('.price, [class*="price"]');
                        const imgEl = item.querySelector('img');
                        const linkEl = item.querySelector('a, [href]');

                        if (titleEl && priceEl) {
                            const title = titleEl.textContent?.trim() || '';
                            const priceText = priceEl.textContent?.replace(/[^0-9]/g, '') || '0';
                            const price = parseInt(priceText) || 0;
                            const thumbnail = imgEl?.src || imgEl?.getAttribute('data-src') || '';
                            const link = linkEl?.href || '';

                            if (title && price > 0) {
                                products.push({
                                    title,
                                    price,
                                    thumbnail_url: thumbnail,
                                    product_url: link
                                });
                            }
                        }
                    });

                    return products;
                }
            """)

            logger.info(f"Found {len(products)} products on page")

            # Check for pagination
            next_button = await page.query_selector('a.pagination-next, .next, [rel="next"]')

            return products, next_button is not None

        except Exception as e:
            logger.error(f"Error scraping page {url}: {e}", exc_info=True)
            # Take screenshot on error
            try:
                await page.screenshot(path=f'./logs/screenshots/error_{random.randint(1000,9999)}.png')
                logger.info("Screenshot saved for debugging")
            except:
                pass

            raise

    async def scrape_all_pages(self, max_pages: int = 5) -> List[Dict]:
        """
        Scrape all pages of product listings.

        Args:
            max_pages: Maximum number of pages to scrape

        Returns:
            List of all products found
        """
        browser, context, page = None, None, None
        all_products = []

        try:
            browser, context, page = await self.setup_browser()

            current_url = self.base_url
            page_num = 1

            while current_url and page_num <= max_pages:
                logger.info(f"Scraping page {page_num} of {max_pages}")

                products, has_next = await self.scrape_page(page, current_url)
                all_products.extend(products)

                # Random delay between pages (2-5 seconds)
                delay = random.uniform(2, 5)
                await asyncio.sleep(delay)
                logger.info(f"Delay: {delay:.2f}s before next page")

                # Find next page
                if has_next and page_num < max_pages:
                    page_num += 1
                    # Try to find and click next button
                    try:
                        next_button = await page.query_selector('a.pagination-next, .next, [rel="next"]')
                        if next_button:
                            href = await next_button.get_attribute('href')
                            if href:
                                current_url = href
                            else:
                                current_url = None
                        else:
                            current_url = None
                    except:
                        current_url = None
                else:
                    current_url = None

        finally:
            # Cleanup
            if page:
                await page.close()
            if context:
                await context.close()
            if browser:
                await browser.close()

        logger.info(f"Total products scraped: {len(all_products)}")
        return all_products


async def scrape_listing(base_url: str = None) -> List[Dict]:
    """
    Main function to scrape product listings.

    Args:
        base_url: URL to scrape (uses config if not provided)

    Returns:
        List of product dictionaries
    """
    if base_url is None:
        base_url = config.TARGET_URL

    scraper = ListingScraper(base_url)
    products = await scraper.scrape_all_pages(max_pages=3)

    return products


if __name__ == '__main__':
    # Test scraper
    import sys
    sys.path.insert(0, '/app')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    products = asyncio.run(scrape_listing())

    for i, p in enumerate(products[:5], 1):
        print(f"{i}. {p.get('title')} - {p.get('price')}")
        print(f"   URL: {p.get('product_url')}")
        print(f"   Thumbnail: {p.get('thumbnail_url')}")
