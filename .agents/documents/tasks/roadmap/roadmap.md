# Product Roadmap: FB Marketplace Auto Listing Bot

## Phase 1: Foundation & Shared Infrastructure (Sprint 0)
- Monorepo setup.
- Database schema and Prisma integration.
- Shared packages (Utils, Config).
- Docker Compose environment.

## Phase 2: Data Sourcing & Processing (Sprint 1)
- Scraper service (TypeScript/Playwright).
- Jakartanotebook extraction.
- Image processing (Resize, Watermark).
- Deduplication logic.

## Phase 3: Backend API & Management (Sprint 2)
- Fastify API endpoints.
- Product management logic.
- Redis & BullMQ integration.
- Configuration management.

## Phase 4: Posting Bot (Sprint 3)
- Worker service (BullMQ consumer).
- Facebook session management (Encrypted).
- Marketplace automation (Playwright).
- Anti-detection hardening.

## Phase 5: User Dashboard (Sprint 4)
- Next.js 14 frontend.
- Real-time status monitoring.
- Batch post controls.
- Job history & logs.

## Phase 6: Hardening & Integration (Sprint 5)
- E2E testing.
- Security audit.
- Performance optimization.
- Setup documentation.
