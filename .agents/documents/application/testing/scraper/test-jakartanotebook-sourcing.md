# Test Scenarios: Jakartanotebook Sourcing

## 1. Positive Tests
### SC-01: Successful Cycle
- **Pre-condition:** Jakartanotebook is accessible.
- **Trigger:** Start scraping cycle.
- **Expected Result:** Listing page fetched, details parsed, images processed, and records added to DB with status DRAFT.

### SC-02: Deduplication Test
- **Pre-condition:** Product with hash `XYZ` already exists in DB.
- **Trigger:** Scrape product with hash `XYZ` again.
- **Expected Result:** Database record is not duplicated; update timestamp is modified if data changed.

## 2. Negative Tests
### SC-03: Invalid Price Format
- **Pre-condition:** Source page has a price that cannot be parsed as an integer.
- **Trigger:** Run detail scraper.
- **Expected Result:** Scraper logs an error and skips the product; cycle continues.

### SC-04: Image Download Failure
- **Pre-condition:** Image URL returns 500 error.
- **Trigger:** Run image processor.
- **Expected Result:** Product is saved to DB but `imageLocal` field is NULL; error is logged.

## 3. Edge Cases
### SC-05: Empty Listing Page
- **Pre-condition:** Category has no products.
- **Trigger:** Run listing scraper.
- **Expected Result:** System logs "No products found" and finishes cycle gracefully.

### SC-06: Out of Stock Product
- **Pre-condition:** Product detail page shows "Out of Stock".
- **Trigger:** Run detail scraper.
- **Expected Result:** Product is skipped and not saved to DB.
