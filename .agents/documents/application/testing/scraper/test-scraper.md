# Testing Plan: Multi-Source Scraper (TS)

## 1. Unit Testing (Vitest)

Focus: Business logic without browser dependency.

- **T-UNI-01: Data Processor (Markup)**
    - Verify price markup calculation (e.g., 25%) and rounding to the nearest thousand.
- **T-UNI-02: Data Processor (Normalization)**
    - Verify title normalization (stripping HTML, extra whitespace).
- **T-UNI-03: Data Processor (Hashing)**
    - Verify that identical products (same Title/Price) generate the same hash, and different products generate unique hashes.
- **T-UNI-04: Provider Factory**
    - Verify that `tokopedia.com` URL returns the `TokopediaProvider` instance.

## 2. Integration Testing (Playwright + Mocks)

Focus: DOM parsing logic.

- **T-INT-01: Tokopedia DOM Parsing**
    - Use a saved HTML snapshot of a Tokopedia product page.
    - Assert that `TokopediaProvider.scrapeDetail()` extracts the correct attributes.
- **T-INT-02: Shopee DOM Parsing**
    - Use a saved HTML snapshot of a Shopee product page.
    - Assert that `ShopeeProvider.scrapeDetail()` extracts the correct attributes.
- **T-INT-03: Proxy Integration**
    - Verify that the browser context uses the configured proxy server.

## 3. E2E Testing (System Flow)

Focus: End-to-end integration with Database and Storage.

- **T-E2E-01: Manual Scrape Trigger**
    - Call `POST /api/scraper/jobs` with a Tokopedia URL.
    - Assert that the job completes and the product appears in the `Product` table.
- **T-E2E-02: Image Localization**
    - Trigger a scrape.
    - Assert that images are downloaded to `images/raw/` and `imageLocal` field is populated in the DB.
- **T-E2E-03: Invalid Job Request (Negative)**
    - Call `POST /api/scraper/jobs` with an unsupported URL (e.g., `google.com`).
    - Assert that the API returns `422 Unprocessable Entity` with `invalid_url` code.

## 4. Performance & Reliability

- **T-REL-01: Anti-Bot Retry**
    - Simulate a `403 Forbidden` response.
    - Assert that the provider retries with a 600s delay and a different proxy.
- **T-PER-01: Concurrent Load**
    - Run 5 concurrent scrapes.
    - Assert that memory usage remains stable (< 4GB total).

---

## Related Documents
- **Module Overview**: [Scraper Overview](../../modules/scraper/overview.md)
- **API Specification**: [Scraper API](../../api/scraper/api-scraper.md)

[Back to Testing Index](../../README.md)
