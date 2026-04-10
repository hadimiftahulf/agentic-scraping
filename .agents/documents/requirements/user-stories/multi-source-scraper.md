# User Stories: Multi-Source Scraper Expansion

**Story 1: Scrape from Tokopedia**
- Story: As a Dropshipper, I want to import product data from Tokopedia URLs, so that I can diversify my inventory with high-demand products from different suppliers.
- Acceptance Criteria (Given/When/Then):
  1. **Given** a valid Tokopedia product URL, **When** I trigger the scraper, **Then** the system extracts title, price, description, images, and stock status correctly.
  2. **Given** a Tokopedia listing/category URL, **When** I trigger the scraper, **Then** it identifies and queues all individual product links on the page.
  3. **Given** a product that is out of stock on Tokopedia, **When** I scrape it, **Then** the system marks the status as 'out_stock' in the database.

**Story 2: Scrape from Shopee**
- Story: As a Dropshipper, I want to import product data from Shopee URLs, so that I can offer products from the largest marketplace in Indonesia.
- Acceptance Criteria (Given/When/Then):
  1. **Given** a valid Shopee product URL, **When** I trigger the scraper, **Then** it bypasses common anti-bot checks and extracts the full product schema.
  2. **Given** a Shopee URL, **When** the scraper detects a Cloudflare/Captcha challenge, **Then** it retries with a different residential proxy after a 300-second delay.
  3. **Given** the system extracts a Shopee price, **When** it saves to the DB, **Then** it applies the global markup percentage automatically.

**Story 3: Modular Provider Architecture**
- Story: As a Developer, I want the scraper to use a "Provider" pattern in TypeScript, so that I can add new marketplace sources (like TikTok Shop) without modifying the core scraper logic.
- Acceptance Criteria (Given/When/Then):
  1. **Given** the existing code structure, **When** I implement a new scraper, **Then** it must follow a shared `BaseProvider` interface with consistent `scrapeListing()` and `scrapeDetail()` methods.
  2. **Given** a scraper job in the queue, **When** it starts, **Then** it identifies the correct Provider based on the URL domain (e.g., tokopedia.com -> TokopediaProvider).
  3. **Given** a change in Tokopedia's DOM structure, **When** I update the `TokopediaProvider`, **Then** the code for Shopee or JakartaNotebook remains unaffected and functional.

**Story 4: Automated Image Localization**
- Story: As a Dropshipper, I want the scraper to download and process product images during the scrape cycle, so that they are ready for posting to FB Marketplace without manual link conversion.
- Acceptance Criteria (Given/When/Then):
  1. **Given** a scraper extracts image URLs, **When** it processes the job, **Then** it downloads the images to the configured local storage directory.
  2. **Given** downloaded images, **When** the scrape is complete, **Then** the product record in the DB points to the local file path instead of the external URL.
  3. **Given** a failed image download, **When** the scrape finishes, **Then** it flags the product status as 'pending_images' and logs the specific error.

**Coverage Summary**
- **Covered**: Happy path scraping for Tokopedia/Shopee, Architecture modularity, Anti-bot strategies (Proxies/Delay), and Media handling.
- **Excluded**: TikTok Shop implementation (deferred to next sprint), Advanced price comparison logic, and manual captcha UI.

**Suggested Story Order**
1. **Story 3 (Architecture)**: Crucial foundation. Cannot build providers without the pattern.
2. **Story 4 (Images)**: Essential utility for all providers.
3. **Story 1 (Tokopedia)**: The "Quick Win" source to prove the architecture.
4. **Story 2 (Shopee)**: The high-complexity challenge to tackle once the foundation is stable.
