"""Configuration module for Python scraper."""
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Scraper
    TARGET_URL: str = os.getenv(
        "TARGET_URL",
        "https://www.jakartanotebook.com/category/laptop"
    )
    SCRAPER_INTERVAL_MINUTES: int = int(
        os.getenv("SCRAPER_INTERVAL_MINUTES", "20")
    )

    # Product Processing
    PRICE_MARKUP_PERCENT: float = float(
        os.getenv("PRICE_MARKUP_PERCENT", "25")
    )
    MIN_PRICE: int = int(os.getenv("MIN_PRICE", "0"))
    MAX_PRICE: int = int(os.getenv("MAX_PRICE", "50000000"))
    BLACKLIST_KEYWORDS: List[str] = [
        k.strip()
        for k in os.getenv("BLACKLIST_KEYWORDS", "").split(",")
        if k.strip()
    ]

    # Image Processing
    IMAGES_DIR: str = "./images"
    WATERMARK_TEXT: str = os.getenv("WATERMARK_TEXT", "TokoGue.id")
    WATERMARK_POSITION: str = os.getenv("WATERMARK_POSITION", "bottom-right")
    WATERMARK_OPACITY: float = float(os.getenv("WATERMARK_OPACITY", "0.7"))
    WATERMARK_FONT_SIZE: int = int(os.getenv("WATERMARK_FONT_SIZE", "40"))

    # Headless mode (for debugging, can set to false)
    HEADLESS: bool = os.getenv("HEADLESS", "true").lower() == "true"

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    def validate(self) -> None:
        """Validate required configuration."""
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required")
        if not self.TARGET_URL:
            raise ValueError("TARGET_URL is required")
        if self.PRICE_MARKUP_PERCENT < 0 or self.PRICE_MARKUP_PERCENT > 200:
            raise ValueError("PRICE_MARKUP_PERCENT must be between 0 and 200")


config = Config()
config.validate()
