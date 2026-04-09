"""Stealth configuration for Playwright to avoid bot detection."""
import random
import logging
from typing import List

logger = logging.getLogger(__name__)


# List of realistic User-Agent strings
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
]


def get_random_user_agent() -> str:
    """Get a random User-Agent string."""
    return random.choice(USER_AGENTS)


def get_random_viewport() -> dict:
    """Get random viewport dimensions."""
    width = random.randint(1280, 1920)
    height = random.randint(720, 1080)
    return {'width': width, 'height': height}


def get_stealth_init_script() -> str:
    """
    Get JavaScript code to make browser appear less automated.

    Returns:
        JavaScript code string
    """
    return """
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });

    // Override navigator.plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
    });

    // Override navigator.languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
    });

    // Add fake chrome object
    window.chrome = {
        runtime: {}
    };

    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );

    // Add fake plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            {
                0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
                description: "Portable Document Format",
                filename: "internal-pdf-viewer",
                length: 1,
                name: "Chrome PDF Plugin"
            }
        ]
    });
    """


async def setup_stealth_browser(context, page):
    """
    Apply stealth settings to browser context and page.

    Args:
        context: Playwright BrowserContext
        page: Playwright Page
    """
    # Random viewport
    viewport = get_random_viewport()
    logger.debug(f"Viewport: {viewport['width']}x{viewport['height']}")

    # Random user agent
    user_agent = get_random_user_agent()
    logger.debug(f"User-Agent: {user_agent[:50]}...")

    # Set context options
    await context.add_init_script(get_stealth_init_script())

    # Simulate human behavior
    # Scroll page
    await page.evaluate("""
        window.scrollBy(0, Math.random() * 100);
    """)

    # Small delay
    import asyncio
    await asyncio.sleep(random.uniform(0.5, 1.5))


# Test function
if __name__ == '__main__':
    print("Stealth Configuration Test")
    print("==========================")
    print(f"Random User-Agent: {get_random_user_agent()}")
    print(f"Random Viewport: {get_random_viewport()}")
    print(f"Init Script Length: {len(get_stealth_init_script())} characters")
