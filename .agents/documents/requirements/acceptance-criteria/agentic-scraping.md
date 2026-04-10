# Acceptance Criteria: FB Marketplace Auto Listing Bot

## 1. Scraping & Data Collection
### US-01: Scrape product data
- **Given** a valid Jakartanotebook category URL
- **When** the scraper runs
- **Then** it shall extract title, raw price, image URL, and description for every available product.

### US-03: Generate unique hash
- **Given** a scraped product title and price
- **When** the system saves the product to the database
- **Then** it shall generate a SHA256 hash of "title + price" and use it as a unique identifier.

## 2. Product Processing
### US-04: Apply price markup
- **Given** a raw price from Jakartanotebook and a markup percentage (e.g., 25%)
- **When** the system processes the product
- **Then** it shall calculate the final price as `raw_price * (1 + markup/100)` and round it to the nearest thousand.

## 3. Image Processing
### US-06: Resize product images
- **Given** a downloaded product image
- **When** the image processor runs
- **Then** it shall output a 1:1 square image with white padding (no cropping).

### US-07: Add watermark
- **Given** a processed image and a configured watermark text
- **When** the image processor runs
- **Then** it shall overlay the text at the bottom-right corner with 70% opacity.

## 4. Dashboard & Management
### US-09: One-click Post
- **Given** a product with status "DRAFT" or "FAILED"
- **When** the user clicks the "Post" button in the dashboard
- **Then** the system shall change the status to "PROCESSING" and push a job to the `post_product` queue.

## 5. Automated Posting
### US-12: Simulate human behavior
- **Given** an active posting job
- **When** the Playwright bot interacts with Facebook
- **Then** it shall use random delays (1-3s) between actions and typing speeds between 50-150ms per character.

### US-13: Daily post limit
- **Given** the daily post limit is set to 8
- **When** the worker processes a job and the counter for today is already 8
- **Then** it shall reschedule the job to the next day at 8 AM.
