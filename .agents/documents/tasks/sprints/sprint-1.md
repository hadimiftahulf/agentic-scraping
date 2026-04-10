# Sprint 1: Scraper Service (TypeScript)

**Goal:** Implement the scraper service to extract product data from Jakartanotebook and upsert to the database.

## Tasks
- **T-101**: Setup Node.js project in `apps/scraper` with Playwright.
- **T-102**: Implement Listing Scraper (fetch categories and extract product URLs).
- **T-103**: Implement Detail Scraper (extract title, price, description, images).
- **T-104**: Implement Data Processor (hashing, markup, normalization).
- **T-105**: Implement Image Processor (download, resize 1:1, watermark).
- **T-106**: Setup Cron Job for automated periodic scraping.
- **T-107**: Implement Anti-Detection (random delays, stealth context).

## Definition of Done
- Scraper successfully populates the `Product` table from a Jakartanotebook category.
- Images are processed and stored locally.
- Duplicate products are handled correctly via hash conflict.
- Structured logs are emitted for every scraping cycle.
