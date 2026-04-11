import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { config } from '@bot/config';

export class ImageProcessor {
  private logger = pino({ name: 'ImageProcessor' });

  /**
   * Process product image: download, resize to square, and add watermark
   */
  async processProductImage(productId: string, imageUrl: string): Promise<string | null> {
    const rawDir = path.join(process.cwd(), 'images', 'raw');
    const processedDir = path.join(process.cwd(), 'images', 'processed');
    
    // Create directories if they don't exist
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
    if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

    const rawPath = path.join(rawDir, `${productId}.jpg`);
    const processedPath = path.join(processedDir, `${productId}.jpg`);

    try {
      // 1. Download image
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);

      // 2. Process with Sharp
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize to fit 1000x1000 and pad with white
      let processedImage = image
        .rotate() // Auto-rotate based on EXIF
        .resize(1000, 1000, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        });

      // 3. Add Watermark (via SVG overlay)
      const watermarkText = config.watermarkText || 'TokoGue.id';
      const svgWatermark = `
        <svg width="1000" height="1000">
          <style>
            .watermark { 
              fill: rgba(0, 0, 0, ${config.watermarkOpacity || 0.7}); 
              font-size: ${config.watermarkFontSize || 40}px; 
              font-family: sans-serif; 
              font-weight: bold;
            }
          </style>
          <text x="980" y="960" text-anchor="end" class="watermark">${watermarkText}</text>
        </svg>
      `;

      processedImage = processedImage.composite([
        {
          input: Buffer.from(svgWatermark),
          top: 0,
          left: 0,
        },
      ]);

      // 4. Save
      await processedImage
        .jpeg({ quality: 85 })
        .toFile(processedPath);

      this.logger.info({ processedPath }, 'Processed image saved');
      return processedPath;

    } catch (err) {
      this.logger.error({ err, productId, imageUrl }, 'Error processing image');
      return null;
    }
  }
}
