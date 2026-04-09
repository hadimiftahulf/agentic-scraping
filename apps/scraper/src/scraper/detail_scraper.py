"""Product detail scraper for Jakartanotebook."""
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


class DetailScraper:
    """Scrape detailed product information from Jakartanotebook."""

    def __init__(self):
        """Initialize detail scraper."""
        pass

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

        # Create context
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
        page.set_default_timeout(30000)

        return browser, context, page

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        before_sleep=before_sleep_log(logger, logging.WARNING),
    )
    async def scrape_detail(self, product_url: str) -> Optional[Dict]:
        """
        Scrape product detail page.

        Args:
            product_url: URL of product detail page

        Returns:
            Dictionary with product details, or None if failed/404
        """
        browser, context, page = None, None, None

        try:
            browser, context, page = await self.setup_browser()

            logger.info(f"Navigating to product: {product_url}")

            response = await page.goto(product_url, wait_until='networkidle', timeout=30000)

            # Check if page is 404
            if response.status == 404:
                logger.warning(f"Product page not found (404): {product_url}")
                return None

            # Check for common error pages
            title = await page.title()
            if '404' in title.lower() or 'not found' in title.lower():
                logger.warning(f"Product not found: {product_url}")
                return None

            # Wait for content to load
            await page.wait_for_selector('h1, .product-title, .title', timeout=10000)

            # Extract product details
            # Note: Selectors need to be adjusted based on actual Jakartanotebook HTML structure
            product_detail = await page.evaluate("""
                () => {
                    // Extract title
                    const titleEl = document.querySelector('h1, .product-title, .title');
                    const title = titleEl?.textContent?.trim() || '';

                    // Extract price
                    const priceEl = document.querySelector('.price, [class*="price"], .price-display');
                    let priceText = priceEl?.textContent || '0';
                    priceText = priceText.replace(/[^0-9]/g, '');
                    const price = parseInt(priceText) || 0;

                    // Extract description
                    const descEl = document.querySelector('.description, [class*="desc"], #product-desc');
                    const description = descEl?.textContent?.trim() || '';

                    // Extract images
                    const images = [];
                    const imgElements = document.querySelectorAll('.product-gallery img, .product-images img, .main-image img');

                    imgElements.forEach((img, index) => {
                        if (index < 5) { // Max 5 images
                            const src = img.src || img.getAttribute('data-src') || '';
                            if (src) {
                                images.push(src);
                            }
                        }
                    });

                    // Check stock status
                    const stockEl = document.querySelector('[class*="stock"], .availability, .stock-status');
                    let inStock = true;
                    if (stockEl) {
                        const stockText = stockEl.textContent?.toLowerCase() || '';
                        inStock = !stockText.includes('habis') &&
                                   !stockText.includes('out of stock') &&
                                   !stockText.includes('sold out');
                    }

                    return {
                        title,
                        price,
                        description,
                        image_urls: images,
                        in_stock: inStock
                    };
                }
            """)

            # Normalize title
            product_detail['title'] = ' '.join(product_detail.get('title', '').split())

            # Add source URL
            product_detail['source_url'] = product_url

            # Validate required fields
            if not product_detail.get('title') or not product_detail.get('price'):
                logger.warning(f"Invalid product data: {product_url}")
                return None

            logger.info(f"Scraped product: {product_detail['title']} (price: {product_detail['price']}, stock: {product_detail.get('in_stock')})")

            return product_detail

        except Exception as e:
            logger.error(f"Error scraping product detail {product_url}: {e}", exc_info=True)

            # Take screenshot on error
            if page:
                try:
                    await page.screenshot(path=f'./logs/screenshots/error_detail_{random.randint(1000,9999)}.png')
                    logger.info("Screenshot saved for debugging")
                except:
                    pass

            return None

        finally:
            # Cleanup
            if page:
                await page.close()
            if context:
                await context.close()
            if browser:
                await browser.close()


async def scrape_detail(product_url: str) -> Optional[Dict]:
    """
    Main function to scrape product detail.

    Args:
        product_url: URL of product detail page

    Returns:
        Dictionary with product details, or None if failed
    """
    scraper = DetailScraper()
    return await scraper.scrape_detail(product_url)


if __name__ == '__main__':
    # Test scraper
    import sys
    sys.path.insert(0, '/app')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test with sample URL (needs to be updated with actual Jakartanotebook URL)
    test_url = "https://www.jakartanotebook.com/placeholder-product-url"
    detail = asyncio.run(scrape_detail(test_url))

    if detail:
        print("Product Detail:")
        print(f"  Title: {detail.get('title')}")
        print(f"  Price: {detail.get('price')}")
        print(f"  Description: {detail.get('description', '')[:100]}...")
        print(f"  Images: {len(detail.get('image_urls', []))}")
        print(f"  In Stock: {detail.get('in_stock')}")
    else:
        print("Failed to scrape product detail")
