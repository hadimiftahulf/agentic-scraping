"""Tests for data processor module."""
import pytest
from src.processor.data_processor import (
    apply_markup,
    generate_hash,
    normalize_title,
    filter_product,
    process_product,
    FilterConfig,
)


class TestApplyMarkup:
    """Test price markup function."""

    def test_basic_markup(self):
        """Test basic markup calculation."""
        assert apply_markup(1_000_000, 25) == 1_250_000
        assert apply_markup(1_000_000, 50) == 1_500_000
        assert apply_markup(1_000_000, 100) == 2_000_000

    def test_markup_rounding(self):
        """Test rounding to nearest thousand."""
        assert apply_markup(1_234_567, 25) == 1_543_000
        assert apply_markup(1_000_100, 0) == 1_000_000

    def test_zero_markup(self):
        """Test zero markup."""
        assert apply_markup(1_500_000, 0) == 1_500_000


class TestGenerateHash:
    """Test hash generation."""

    def test_same_input_same_hash(self):
        """Same input should generate same hash."""
        hash1 = generate_hash("Laptop ASUS", 1_500_000)
        hash2 = generate_hash("Laptop ASUS", 1_500_000)
        assert hash1 == hash2

    def test_different_price_different_hash(self):
        """Different price should generate different hash."""
        hash1 = generate_hash("Laptop ASUS", 1_500_000)
        hash2 = generate_hash("Laptop ASUS", 1_600_000)
        assert hash1 != hash2

    def test_different_title_different_hash(self):
        """Different title should generate different hash."""
        hash1 = generate_hash("Laptop ASUS", 1_500_000)
        hash2 = generate_hash("Laptop Dell", 1_500_000)
        assert hash1 != hash2

    def test_hash_is_hex(self):
        """Hash should be valid hex string."""
        hash_value = generate_hash("Test", 1000)
        assert len(hash_value) == 64  # SHA256 is 64 hex chars
        assert all(c in '0123456789abcdef' for c in hash_value)


class TestNormalizeTitle:
    """Test title normalization."""

    def test_remove_extra_whitespace(self):
        """Remove extra whitespace."""
        assert normalize_title("Laptop   ASUS   VivoBook") == "Laptop ASUS VivoBook"
        assert normalize_title("  Laptop  ASUS  ") == "Laptop ASUS"

    def test_decode_html_entities(self):
        """Decode HTML entities."""
        assert normalize_title("Laptop&nbsp;ASUS") == "Laptop ASUS"
        assert normalize_title("Laptop&amp;Dell") == "Laptop&Dell"

    def test_mixed(self):
        """Test mixed HTML entities and whitespace."""
        result = normalize_title("Laptop&nbsp;&nbsp;ASUS   VivoBook")
        assert result == "Laptop ASUS VivoBook"


class TestFilterProduct:
    """Test product filtering."""

    def test_pass_price_range(self):
        """Product within price range should pass."""
        product = {'title': 'Laptop', 'price': 15_000_000}
        config = FilterConfig(min_price=10_000_000, max_price=20_000_000)
        assert filter_product(product, config) is True

    def test_fail_price_too_low(self):
        """Product below minimum price should fail."""
        product = {'title': 'Laptop', 'price': 5_000_000}
        config = FilterConfig(min_price=10_000_000, max_price=20_000_000)
        assert filter_product(product, config) is False

    def test_fail_price_too_high(self):
        """Product above maximum price should fail."""
        product = {'title': 'Laptop', 'price': 25_000_000}
        config = FilterConfig(min_price=10_000_000, max_price=20_000_000)
        assert filter_product(product, config) is False

    def test_pass_no_blacklist(self):
        """Product without blacklisted keywords should pass."""
        product = {'title': 'Laptop Gaming', 'price': 15_000_000}
        config = FilterConfig(
            min_price=0,
            max_price=100_000_000,
            blacklist_keywords=['bundle', 'rusak']
        )
        assert filter_product(product, config) is True

    def test_fail_blacklist_keyword(self):
        """Product with blacklisted keyword should fail."""
        product = {'title': 'Laptop Gaming Bundle', 'price': 15_000_000}
        config = FilterConfig(
            min_price=0,
            max_price=100_000_000,
            blacklist_keywords=['bundle', 'rusak']
        )
        assert filter_product(product, config) is False

    def test_case_insensitive_blacklist(self):
        """Blacklist should be case insensitive."""
        product = {'title': 'Laptop Gaming BUNDLE', 'price': 15_000_000}
        config = FilterConfig(
            min_price=0,
            max_price=100_000_000,
            blacklist_keywords=['bundle']
        )
        assert filter_product(product, config) is False


class TestProcessProduct:
    """Test complete product processing."""

    def test_valid_product(self):
        """Test processing a valid product."""
        raw_data = {
            'title': 'Laptop ASUS VivoBook',
            'price': 1_000_000,
            'description': 'Specifications here',
            'source_url': 'https://example.com/product/1',
            'image_urls': ['https://example.com/image.jpg']
        }

        result = process_product(raw_data)

        assert result is not None
        assert 'id' in result
        assert result['title'] == 'Laptop ASUS VivoBook'
        assert result['price'] > 1_000_000  # Should be marked up
        assert 'hash' in result
        assert len(result['hash']) == 64

    def test_invalid_no_title(self):
        """Product without title should return None."""
        raw_data = {
            'title': '',
            'price': 1_000_000
        }

        result = process_product(raw_data)
        assert result is None

    def test_invalid_price(self):
        """Product with zero/negative price should return None."""
        raw_data = {
            'title': 'Laptop',
            'price': 0
        }

        result = process_product(raw_data)
        assert result is None

    def test_filtered_product(self):
        """Product that gets filtered should return None."""
        raw_data = {
            'title': 'Laptop Gaming Bundle',
            'price': 1_000_000
        }

        # Mock config to include 'bundle' in blacklist
        import src.config as config_module
        original_blacklist = config_module.config.BLACKLIST_KEYWORDS

        try:
            config_module.config.BLACKLIST_KEYWORDS = ['bundle']
            result = process_product(raw_data)
            assert result is None
        finally:
            # Restore original config
            config_module.config.BLACKLIST_KEYWORDS = original_blacklist
