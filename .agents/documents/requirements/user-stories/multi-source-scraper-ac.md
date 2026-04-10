# Acceptance Criteria: Multi-Source Scraper Expansion

**User Story**: Multi-Source Scraper Implementation (Tokopedia, Shopee)
**Stack**: TypeScript, Playwright, PostgreSQL, Redis, BullMQ
**Context**: Expanding from Python-based JakartaNotebook scraper to a modular TS-based architecture.

## 1. Happy Path Criteria

- **AC-HP-01: Scraper Provider Identification**
    - **Given** a valid product URL from `tokopedia.com` or `shopee.co.id`,
    - **When** the scraper job is processed,
    - **Then** the system must correctly instantiate the corresponding `TokopediaProvider` or `ShopeeProvider`.
- **AC-HP-02: Tokopedia Detail Extraction**
    - **Given** a valid Tokopedia product URL,
    - **When** the `TokopediaProvider` scrapes the page,
    - **Then** it must extract the following fields: `title`, `price` (raw number), `description`, `images` (array of URLs), and `stock` (boolean/number).
- **AC-HP-03: Shopee Detail Extraction**
    - **Given** a valid Shopee product URL,
    - **When** the `ShopeeProvider` scrapes the page,
    - **Then** it must correctly handle the anti-bot landing page and extract all core metadata fields.
- **AC-HP-04: Image Localization**
    - **Given** extracted image URLs,
    - **When** the scraper completes the data extraction,
    - **Then** it must download all images to the local `images/raw/` directory and update the product record with local paths.

## 2. Edge Case Criteria

- **AC-EC-01: Multiple Variations (Shopee)**
    - **Given** a Shopee product with several variants (e.g., color/size) and different prices,
    - **When** the scraper runs,
    - **Then** it must extract the default selected variant's price or the lowest price range available.
- **AC-EC-02: Hidden/Private Product**
    - **Given** a URL for a product that is private or requires login,
    - **When** the scraper attempts to access it,
    - **Then** it must log a `ProductPrivateError` and move the job to the dead letter queue.
- **AC-EC-03: Zero Stock**
    - **Given** a product that exists but is "Stok Habis" (Out of Stock),
    - **When** scraped,
    - **Then** it must save the product to the DB with `stock = 0` and `status = 'out_stock'`.

## 3. Error and Failure Criteria

- **AC-ERR-01: IP Block Mitigation**
    - **Given** the scraper receives a `403 Forbidden` or `429 Too Many Requests` from the marketplace,
    - **When** detected,
    - **Then** it must throw a `RateLimitException`, wait 600 seconds, and retry with a new proxy from the pool.
- **AC-ERR-02: Selector Mismatch (DOM Change)**
    - **Given** a marketplace has changed its HTML structure causing selector failure,
    - **When** the scraper fails to find the `title` field,
    - **Then** it must throw a `SelectorNotFoundError: "title"`, capture a screenshot for debugging, and flag the provider as 'broken'.
- **AC-ERR-03: Storage Full**
    - **Given** the local disk is full during image download,
    - **When** the error occurs,
    - **Then** it must log `StorageFullError` and pause all scraping jobs until cleared.

## 4. Non-Functional Criteria

- **AC-NF-01: Performance (Scrape Duration)**
    - **Given** a single product URL and a warm proxy,
    - **When** scraped,
    - **Then** the total cycle (load, parse, download images) must complete within **45 seconds**.
- **AC-NF-02: Scalability (Concurrent Scrapes)**
    - **Given** 10 concurrent scrapers running in separate Playwright instances,
    - **When** active,
    - **Then** the system must maintain a memory footprint of less than **1.5GB** per instance.
- **AC-NF-03: Reliability (Auto-Recovery)**
    - **Given** a worker crash during a scrape,
    - **When** the worker restarts,
    - **Then** BullMQ must automatically re-queue the failed job for a second attempt.

---

### Testability Notes
- **Anti-Bot Testing**: Testing AC-HP-03 and AC-ERR-01 requires a live environment with actual proxies. It is difficult to mock the exact behavior of Shopee's Cloudflare.
- **Image Validation**: Verification of image localization should include an automated check for file existence and file size (>0).
- **DOM Change**: We recommend setting up "Health Check Jobs" that scrape a known product URL every hour to detect selector mismatches (AC-ERR-02) before users do.
