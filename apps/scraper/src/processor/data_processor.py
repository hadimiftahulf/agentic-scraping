"""Data processor for scraped products."""
import hashlib
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from src.config import config

logger = logging.getLogger(__name__)


@dataclass
class FilterConfig:
    """Configuration for product filtering."""

    min_price: int = 0
    max_price: int = 50_000_000
    blacklist_keywords: List[str] = None

    def __post_init__(self):
        if self.blacklist_keywords is None:
            self.blacklist_keywords = []


def apply_markup(price: int, markup_percent: float) -> int:
    """
    Apply markup percentage to price and round to nearest thousand.

    Args:
        price: Original price
        markup_percent: Markup percentage (e.g., 25 for 25%)

    Returns:
        Marked up price, rounded to nearest thousand
    """
    marked_up = price * (1 + markup_percent / 100)
    rounded = round(marked_up / 1000) * 1000
    return int(rounded)


def generate_hash(title: str, price: int) -> str:
    """
    Generate SHA256 hash from title and price for deduplication.

    Args:
        title: Product title
        price: Product price (after markup)

    Returns:
        SHA256 hash string
    """
    input_str = f"{title}-{price}"
    hash_obj = hashlib.sha256(input_str.encode('utf-8'))
    return hash_obj.hexdigest()


def normalize_title(title: str) -> str:
    """
    Normalize title by stripping HTML entities and extra whitespace.

    Args:
        title: Raw title string

    Returns:
        Normalized title string
    """
    # Decode HTML entities
    html_entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'",
    }

    for entity, replacement in html_entities.items():
        title = title.replace(entity, replacement)

    # Strip extra whitespace
    title = ' '.join(title.split())

    return title.strip()


def filter_product(product: Dict, filter_config: FilterConfig) -> bool:
    """
    Filter product based on configuration.

    Args:
        product: Product dictionary
        filter_config: Filter configuration

    Returns:
        True if product passes filters, False otherwise
    """
    title = product.get('title', '').lower()
    price = product.get('price', 0)

    # Check price range
    if price < filter_config.min_price:
        logger.debug(f"Product filtered: price {price} below minimum {filter_config.min_price}")
        return False

    if price > filter_config.max_price:
        logger.debug(f"Product filtered: price {price} above maximum {filter_config.max_price}")
        return False

    # Check blacklist keywords
    for keyword in filter_config.blacklist_keywords:
        if keyword.lower() in title:
            logger.debug(f"Product filtered: contains blacklisted keyword '{keyword}'")
            return False

    return True


def process_product(raw_data: Dict) -> Optional[Dict]:
    """
    Process raw scraped product data.

    Args:
        raw_data: Raw product data from scraper

    Returns:
        Processed product dictionary, or None if invalid
    """
    try:
        # Generate unique ID
        import uuid
        product_id = str(uuid.uuid4())

        # Normalize title
        title = normalize_title(raw_data.get('title', ''))

        if not title:
            logger.warning("Product has no title, skipping")
            return None

        # Get raw price
        raw_price = raw_data.get('price', 0)
        if raw_price <= 0:
            logger.warning(f"Product has invalid price {raw_price}, skipping")
            return None

        # Apply markup
        marked_up_price = apply_markup(raw_price, config.PRICE_MARKUP_PERCENT)

        # Generate hash
        hash_key = generate_hash(title, marked_up_price)

        # Create filter config
        filter_config = FilterConfig(
            min_price=config.MIN_PRICE,
            max_price=config.MAX_PRICE,
            blacklist_keywords=config.BLACKLIST_KEYWORDS
        )

        # Filter product
        product_for_filter = {
            'title': title,
            'price': marked_up_price
        }

        if not filter_product(product_for_filter, filter_config):
            logger.info(f"Product filtered: {title}")
            return None

        # Build processed product
        processed = {
            'id': product_id,
            'title': title,
            'price': marked_up_price,
            'image_url': raw_data.get('image_urls', [raw_data.get('thumbnail_url')])[0] if raw_data.get('image_urls') else raw_data.get('thumbnail_url'),
            'description': raw_data.get('description', ''),
            'hash': hash_key,
            'source_url': raw_data.get('source_url'),
        }

        logger.info(f"Processed product: {title} (original: {raw_price}, marked up: {marked_up_price})")

        return processed

    except Exception as e:
        logger.error(f"Error processing product: {e}", exc_info=True)
        return None


# Test functions
if __name__ == '__main__':
    import sys
    sys.path.insert(0, '/app')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Test markup
    print("Testing markup:")
    print(f"  1,250,000 + 25% = {apply_markup(1_250_000, 25)}")
    print(f"  2,500,000 + 20% = {apply_markup(2_500_000, 20)}")

    # Test hash
    print("\nTesting hash:")
    hash1 = generate_hash("Laptop ASUS", 1_500_000)
    hash2 = generate_hash("Laptop ASUS", 1_500_000)
    hash3 = generate_hash("Laptop ASUS", 1_600_000)
    print(f"  Hash 1: {hash1[:32]}...")
    print(f"  Hash 2: {hash2[:32]}... (should match hash 1)")
    print(f"  Hash 3: {hash3[:32]}... (should be different)")

    # Test normalize
    print("\nTesting normalize:")
    titles = [
        "Laptop   ASUS   VivoBook",
        "Laptop&nbsp;ASUS&nbsp;VivoBook",
        "Laptop ASUS VivoBook",
    ]
    for t in titles:
        print(f"  '{t}' -> '{normalize_title(t)}'")

    # Test filter
    print("\nTesting filter:")
    test_products = [
        {'title': 'Laptop Gaming', 'price': 10_000_000},
        {'title': 'Laptop Bundle (bonus mouse)', 'price': 15_000_000},
        {'title': 'Laptop Rusak', 'price': 20_000_000},
        {'title': 'Laptop Expensive', 'price': 100_000_000},
    ]

    filter_config = FilterConfig(
        min_price=1_000_000,
        max_price=50_000_000,
        blacklist_keywords=['bundle', 'rusak']
    )

    for p in test_products:
        result = filter_product(p, filter_config)
        print(f"  {p['title']}: {'PASS' if result else 'FILTERED'}")
