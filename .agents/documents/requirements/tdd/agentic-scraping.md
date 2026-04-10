# Technical Design Document: FB Marketplace Auto Listing Bot

## 1. System Architecture
The system follows a monorepo architecture with independent services coordinating via a shared database and message queue.

### Core Components
- **Scraper (Node.js/Playwright):** Data extraction and image processing.
- **API (Fastify):** Central control and data access layer.
- **Worker (BullMQ/Playwright):** Facebook automation engine.
- **Dashboard (Next.js 14):** User management interface.

## 2. Data Model & Persistence
### PostgreSQL Schema
- `Product`: Stores scraped items, processing status, and metadata.
- `Job`: Tracks BullMQ job history and execution logs.

### Redis
- Used as the backend for BullMQ to manage the `post_product` job queue.

## 3. Key Technical Decisions
### Browser Automation
- **Playwright** is used for both scraping and posting due to its superior stealth capabilities and robustness.
- **Stealth Plugins:** Custom context setup to override `navigator.webdriver` and rotate User-Agents.

### Session Management
- Facebook sessions are encrypted using **AES-256** before being saved to the filesystem to protect user accounts.

### Shared Infrastructure
- **Prisma** serves as the unified ORM across all backend services (Scraper, API, Worker).
- **Zod** is used for cross-service validation of configuration and data payloads.

## 4. API Surface
- **Products:** CRUD and batch operations.
- **Config:** Dynamic adjustment of markup, scraper intervals, and post limits.
- **Health:** Monitoring of DB and Redis connections.
