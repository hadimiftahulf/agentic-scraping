"""Image processor for downloading, resizing, and watermarking."""
import os
import logging
import asyncio
import aiohttp
from typing import Optional
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from dataclasses import dataclass
from pathlib import Path
from src.config import config

logger = logging.getLogger(__name__)


@dataclass
class WatermarkConfig:
    """Configuration for watermark."""

    text: str = "TokoGue.id"
    position: str = "bottom-right"  # top-left, top-right, center, bottom-left, bottom-right
    opacity: float = 0.7
    font_size: int = 40
    font_path: Optional[str] = None
    logo_path: Optional[str] = None


def download_image(url: str, save_path: str) -> bool:
    """
    Download image from URL and save to local path.

    Args:
        url: Image URL
        save_path: Local path to save image

    Returns:
        True if successful, False otherwise
    """
    try:
        # Create directory if needed
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        async def _download():
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        content = await response.read()
                        with open(save_path, 'wb') as f:
                            f.write(content)
                        logger.info(f"Downloaded image from {url}")
                        return True
                    else:
                        logger.warning(f"Failed to download {url}: HTTP {response.status}")
                        return False

        return asyncio.run(_download())

    except Exception as e:
        logger.error(f"Error downloading image from {url}: {e}", exc_info=True)
        return False


def resize_square(image_path: str, size: int = 1000) -> Image.Image:
    """
    Resize image to square with white padding (no cropping).

    Args:
        image_path: Path to image file
        size: Target square size

    Returns:
        Resized PIL Image
    """
    try:
        img = Image.open(image_path)

        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        # Calculate padding
        original_width, original_height = img.size
        max_side = max(original_width, original_height)

        # Resize to fit within target size (maintain aspect ratio)
        ratio = size / max_side
        new_width = int(original_width * ratio)
        new_height = int(original_height * ratio)

        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Create square canvas with white background
        canvas = Image.new('RGB', (size, size), 'white')

        # Paste image in center
        offset_x = (size - new_width) // 2
        offset_y = (size - new_height) // 2
        canvas.paste(img, (offset_x, offset_y))

        logger.debug(f"Resized image to {size}x{size} with padding")
        return canvas

    except Exception as e:
        logger.error(f"Error resizing image {image_path}: {e}", exc_info=True)
        raise


def add_watermark(image: Image.Image, watermark_config: WatermarkConfig) -> Image.Image:
    """
    Add text watermark to image.

    Args:
        image: PIL Image
        watermark_config: Watermark configuration

    Returns:
        Image with watermark
    """
    try:
        # Create a copy
        img = image.copy()

        # Create drawing context
        draw = ImageDraw.Draw(img)

        # Load font
        try:
            font = ImageFont.truetype(
                watermark_config.font_path or "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                watermark_config.font_size
            )
        except:
            # Fallback to default font
            font = ImageFont.load_default()

        # Get text size
        bbox = draw.textbbox((0, 0), watermark_config.text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Calculate position
        img_width, img_height = img.size
        padding = 20

        if watermark_config.position == "top-left":
            x, y = padding, padding
        elif watermark_config.position == "top-right":
            x, y = img_width - text_width - padding, padding
        elif watermark_config.position == "bottom-left":
            x, y = padding, img_height - text_height - padding
        elif watermark_config.position == "bottom-right":
            x, y = img_width - text_width - padding, img_height - text_height - padding
        else:  # center
            x, y = (img_width - text_width) // 2, (img_height - text_height) // 2

        # Draw watermark with opacity
        # PIL doesn't support alpha directly on RGB, so we create a transparent overlay
        watermark_img = Image.new('RGBA', (text_width + padding, text_height + padding), (0, 0, 0, 0))
        watermark_draw = ImageDraw.Draw(watermark_img)

        # Calculate alpha value (0-255)
        alpha = int(watermark_config.opacity * 255)

        watermark_draw.text(
            (padding // 2, padding // 2),
            watermark_config.text,
            font=font,
            fill=(0, 0, 0, alpha)
        )

        # Convert watermark to RGB and paste
        watermark_rgb = watermark_img.convert('RGB')
        img.paste(watermark_rgb, (x, y), watermark_img)

        logger.debug(f"Added watermark at {watermark_config.position}")
        return img

    except Exception as e:
        logger.error(f"Error adding watermark: {e}", exc_info=True)
        return image


def process_product_image(product_id: str, image_url: str) -> Optional[str]:
    """
    Process product image: download, resize, watermark, and save.

    Args:
        product_id: Product ID
        image_url: Image URL

    Returns:
        Local path to processed image, or None if failed
    """
    try:
        # Paths
        raw_path = f"./images/raw/{product_id}.jpg"
        processed_path = f"./images/processed/{product_id}.jpg"

        # Download image
        if not download_image(image_url, raw_path):
            logger.warning(f"Failed to download image for product {product_id}")
            return None

        # Check if file exists
        if not os.path.exists(raw_path):
            logger.warning(f"Image file not found: {raw_path}")
            return None

        # Resize
        resized = resize_square(raw_path, size=1000)

        # Create watermark config
        watermark_config = WatermarkConfig(
            text=config.WATERMARK_TEXT,
            position=config.WATERMARK_POSITION,
            opacity=config.WATERMARK_OPACITY,
            font_size=config.WATERMARK_FONT_SIZE,
        )

        # Add watermark
        watermarked = add_watermark(resized, watermark_config)

        # Save processed image
        os.makedirs(os.path.dirname(processed_path), exist_ok=True)
        watermarked.save(processed_path, 'JPEG', quality=85)

        logger.info(f"Processed image saved: {processed_path}")

        # Delete raw image to save space
        try:
            os.remove(raw_path)
        except:
            pass

        return processed_path

    except Exception as e:
        logger.error(f"Error processing image for product {product_id}: {e}", exc_info=True)
        return None


# Test functions
if __name__ == '__main__':
    import sys
    sys.path.insert(0, '/app')

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("Image Processor Test")
    print("===================")

    # Test with a sample image URL (will need to be updated)
    # test_url = "https://via.placeholder.com/800x600"
    # test_id = "test-product-123"
    # result = process_product_image(test_id, test_url)
    # print(f"\nProcessed image path: {result}")
