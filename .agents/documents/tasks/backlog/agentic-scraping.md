# Task Backlog: FB Marketplace Auto Listing Bot

## Phase 0: Foundation
- **T-001**: Setup Monorepo structure (apps/scraper, apps/api, apps/worker, apps/web).
- **T-002**: Configure Shared Packages (db, utils, config).
- **T-003**: Setup Docker Compose for development (Postgres, Redis).

## Phase 1: Scraper Service (Python)
- **T-101**: Setup Python environment and Playwright.
- **T-102**: Implement Jakartanotebook Listing Scraper.
- **T-103**: Implement Jakartanotebook Detail Scraper.
- **T-104**: Implement Data Processor (Markup, Hash, Normalization).
- **T-105**: Implement Image Processor (Resize, Watermark).
- **T-106**: Setup APScheduler for periodic scraping.

## Phase 2: Backend API & Queue
- **T-201**: Setup Fastify API with TypeScript.
- **T-202**: Integrate Prisma with Postgres.
- **T-203**: Implement Product CRUD Endpoints.
- **T-204**: Setup BullMQ with Redis.
- **T-205**: Implement Posting Trigger Endpoint (Post to Queue).

## Phase 3: Posting Worker (Playwright)
- **T-301**: Setup Worker with BullMQ consumer.
- **T-302**: Implement Facebook Login & Session Management (Encrypted).
- **T-303**: Implement Browser Stealth and Human Simulation.
- **T-304**: Implement FB Marketplace Listing Automation (Form Filling).
- **T-305**: Implement Success Verification and Error Logging.

## Phase 4: Frontend Dashboard (Next.js)
- **T-401**: Setup Next.js with App Router and Tailwind.
- **T-402**: Implement API Client and React Query.
- **T-403**: Build Product List View with Filters.
- **T-404**: Build Product Detail View and Job Logs.
- **T-405**: Implement "Post" Action with Optimistic UI.
