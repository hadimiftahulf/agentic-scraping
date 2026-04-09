"""Processor module initialization."""
from .data_processor import (
    apply_markup,
    generate_hash,
    normalize_title,
    filter_product,
    process_product,
    FilterConfig,
)
from .image_processor import (
    download_image,
    resize_square,
    add_watermark,
    process_product_image,
    WatermarkConfig,
)

__all__ = [
    'apply_markup',
    'generate_hash',
    'normalize_title',
    'filter_product',
    'process_product',
    'FilterConfig',
    'download_image',
    'resize_square',
    'add_watermark',
    'process_product_image',
    'WatermarkConfig',
]
