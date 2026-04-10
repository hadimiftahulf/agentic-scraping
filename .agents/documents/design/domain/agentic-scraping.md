# Domain Model: FB Marketplace Auto Listing Bot

## 1. Entities & Aggregates

### Product (Aggregate Root)
- **ID:** UUID
- **Title:** String (Name of the product)
- **Price:** Integer (Selling price with markup)
- **Description:** String (Formatted product description)
- **Image URL:** String (Original source)
- **Image Local:** String (Path to processed 1:1 watermarked image)
- **Hash:** String (Unique identifier based on title and price)
- **Status:** Enum (DRAFT, PROCESSING, POSTED, FAILED)
- **Source URL:** String (Jakartanotebook link)
- **Metadata:** JSON (Additional scraped fields)
- **Timestamps:** CreatedAt, UpdatedAt, PostedAt

### Job (Entity)
- **ID:** UUID
- **Product ID:** UUID (Reference to Product)
- **Status:** String (Job queue status)
- **Log:** String (Execution log or error message)
- **Attempt:** Integer (Retry count)
- **CreatedAt:** Timestamp

## 2. Value Objects
- **Price:** Encapsulates currency and rounding logic.
- **ProductHash:** Encapsulates the logic for generating a unique fingerprint.

## 3. Domain Events
- **ProductScraped:** Dispatched when a new product is added to the database.
- **PostingRequested:** Dispatched when a user triggers a post action.
- **PostingSucceeded:** Dispatched when the worker confirms a successful FB listing.
- **PostingFailed:** Dispatched when an error occurs during automation.

## 4. Glossary
- **Scraping:** The act of extracting data from Jakartanotebook.
- **Markup:** The percentage added to the original price for profit.
- **Watermark:** A text or logo overlay on images for branding.
- **Stealth Mode:** Browser automation techniques used to avoid bot detection.
