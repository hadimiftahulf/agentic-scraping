# ADR-002: Database Choice - PostgreSQL with Prisma ORM

## Context

The system needs a reliable relational database for storing products, jobs, and user configurations. We need an ORM that works well with TypeScript and supports migrations.

## Decision

We will use **PostgreSQL** as the primary database with **Prisma** as the ORM.

## Alternatives Considered

- **SQLite:** Simpler but not suitable for production multi-service deployments.
- **MongoDB:** Less strict schema, harder to enforce data integrity for products.
- **MySQL:** Viable alternative, but PostgreSQL has better JSON support and stronger consistency guarantees.

## Consequences

- **Type Safety:** Prisma provides full type safety for all database operations.
- **Migrations:** Prisma Migrate handles schema changes with version control.
- **Performance:** PostgreSQL handles concurrent connections well via connection pooling.
- **Shared Access:** All services (Scraper, API, Worker) use Prisma to access the same database.
