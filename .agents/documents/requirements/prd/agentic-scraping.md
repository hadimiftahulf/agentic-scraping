# Product Requirements Document: FB Marketplace Auto Listing Bot

## 1. Vision & Objective
Automate the end-to-end flow of sourcing products from Jakartanotebook and listing them on Facebook Marketplace to maximize seller efficiency and scale.

## 2. Target Audience
Personal dropshippers and small-scale resellers in Indonesia using Facebook Marketplace.

## 3. Prioritized Features (MoSCoW)
### Must-Haves (P0)
- Automated scraping of Jakartanotebook listings and details.
- Image processing: 1:1 resize and watermark.
- Facebook Marketplace posting automation using Playwright.
- Hash-based deduplication.
- Status tracking dashboard.

### Should-Haves (P1)
- Anti-detection simulation (human-like behavior).
- Batch posting support.
- Encrypted session management.

### Could-Haves (P2)
- AI-generated descriptions and titles.
- Telegram notifications.
- Auto-reply for customer inquiries.

## 4. User Journeys
### Journey 1: Automated Sourcing
1. System runs scraper on a schedule.
2. New products are processed (markup + image resize).
3. Products appear in the dashboard as "DRAFT".

### Journey 2: One-Click Posting
1. User reviews products in the dashboard.
2. User clicks "Post" on selected items.
3. System queues jobs and worker processes them sequentially.
4. User receives notification or sees "POSTED" status.

## 5. Non-Functional Requirements
- **Efficiency:** Posting takes less than 60s per item.
- **Security:** Facebook credentials/sessions are never stored in plaintext.
- **Resilience:** Automatic retries for failed network requests or image downloads.
