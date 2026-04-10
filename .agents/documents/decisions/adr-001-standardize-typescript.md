# ADR-001: Standardizing on TypeScript for the Entire Stack

## Context
Initially, the scraper service was planned to be implemented in Python using Playwright and BeautifulSoup. The backend API and worker services were already planned in Node.js (TypeScript).

## Decision
We will use **Node.js (TypeScript)** for the Scraper service as well.

## Alternatives Considered
- **Python (Scraper):** Good for quick prototyping and has a rich scraping ecosystem, but introduces language fragmentation in the monorepo and requires a separate database client implementation.

## Consequences
- **Consistency:** The entire codebase now uses a single language (TypeScript), simplifying development and onboarding.
- **Code Sharing:** We can share the `packages/db` (Prisma) and `packages/utils` directly with the scraper service.
- **Deployment:** Docker images for all services will follow a similar pattern, reducing infrastructure complexity.
- **Playwright Parity:** Playwright has excellent TypeScript support, matching or exceeding its Python equivalent.
