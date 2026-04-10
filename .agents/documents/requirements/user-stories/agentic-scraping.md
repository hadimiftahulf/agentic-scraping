# User Stories: FB Marketplace Auto Listing Bot

## 1. Scraping & Data Collection
- **US-01**: As a seller, I want to automatically scrape product data (title, price, image, description) from Jakartanotebook categories so that I don't have to manually copy information.
- **US-02**: As a seller, I want the scraper to run on a configurable schedule (every 20 minutes) so that my product database is always up to date with the latest stock.
- **US-03**: As a system, I want to generate a unique hash for each product (title + price) so that I can prevent duplicate listings in my database.

## 2. Product Processing
- **US-04**: As a seller, I want to apply a configurable price markup (%) to scraped products so that I can automatically calculate my selling price and profit margin.
- **US-05**: As a seller, I want to filter products by price range or keywords so that I only list items that fit my niche.

## 3. Image Processing
- **US-06**: As a seller, I want to automatically resize product images to a 1:1 square format so that they look optimal on Facebook Marketplace.
- **US-07**: As a seller, I want to automatically add a watermark (text or logo) to product images so that my listings are branded and protected from being copied.

## 4. Dashboard & Management
- **US-08**: As a seller, I want to view all scraped products in a dashboard with their current status (DRAFT, PROCESSING, POSTED, FAILED) so that I can manage my inventory.
- **US-09**: As a seller, I want to click a "Post" button on a product to trigger the automated listing process.
- **US-10**: As a seller, I want to view the history and logs of each posting attempt so that I can troubleshoot any failures.

## 5. Automated Posting
- **US-11**: As a system, I want to use a background worker and queue to handle the posting process so that the dashboard remains responsive.
- **US-12**: As a system, I want to simulate human behavior (typing speed, random delays, scrolling) during the Facebook Marketplace listing process so that the account remains safe from automated bot detection.
- **US-13**: As a seller, I want to limit the number of posts per day (e.g., 5-10 items) to stay within Facebook's safe usage limits.
