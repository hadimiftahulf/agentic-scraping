# Functional Specification: FB Marketplace Auto Listing Bot

## 1. System Overview

The system is a collection of services designed to automate the process of sourcing products from Indonesian marketplaces and listing them on Facebook Marketplace. It consists of a Scraper (Node.js/TypeScript), Backend API (Node.js/Fastify), Worker (Node.js/BullMQ/Playwright), and a Dashboard (Next.js 14).

## 2. Product Sources (V1 Scope)

### Primary Source

- **Jakartanotebook** (https://jakartanotebook.com)
  - Product focus: Accessories, gadgets, electronics
  - Difficulty: Easy
  - Auth required: No
  - Status: Implemented

### Future Enhancements (Post-V1)

- **Shopee Indonesia** - Requires authenticated session + proxy
- **Tokopedia** - Requires Cloudflare bypass + proxy
- **Lazada Indonesia** - Requires CAPTCHA handling

## 3. Functional Requirements

### FR-01: Product Scraping

- The system shall scrape product listings and details from Jakartanotebook.
- The scraper shall run on a configurable cron schedule.
- The system shall use a hash-based mechanism to prevent duplicate products.
- **Decision**: Multi-marketplace support deferred to V1.1+ due to additional complexity (auth/session management, proxy costs)

### FR-02: Data Normalization & Markup

- The system shall normalize raw price data into integers.
- The system shall apply a configurable percentage markup to the raw price.
- The system shall round the final price to the nearest thousand.

### FR-03: Image Processing

- The system shall download product images locally.
- The system shall resize images to 1:1 square ratio with white padding.
- The system shall add a configurable watermark text or logo.

### FR-04: Posting Engine

- The system shall use Playwright to automate the Facebook Marketplace listing form.
- The system shall support persistent login sessions.
- The system shall simulate human typing and interaction behavior.

### FR-05: Management Dashboard

- The UI shall display a list of scraped products with status filters.
- The UI shall provide a "Post" button for each product.
- The UI shall show real-time status updates for processing jobs.

## 3. Non-Functional Requirements

### NFR-01: Performance

- Scraper: Less than 5 seconds per page.
- Posting: Less than 60 seconds per item.

### NFR-02: Reliability

- The system shall retry failed posting jobs up to 3 times with exponential backoff.

### NFR-03: Security

- Facebook sessions shall be stored in an encrypted format.
- No plaintext credentials shall be committed to the repository.

### NFR-04: Anti-Detection

- The posting bot shall use random delays between actions to avoid being flagged as a bot.
