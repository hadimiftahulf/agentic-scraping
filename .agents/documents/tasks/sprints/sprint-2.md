# Sprint 2: Backend API & Queue System

**Goal:** Functional REST API for product management and asynchronous posting trigger.

## Tasks
- **T-201**: Setup Fastify API project in `apps/api`.
- **T-202**: Integrate Prisma client and implement CRUD for products.
- **T-203**: Setup Redis and initialize BullMQ queue (`post_product`).
- **T-204**: Implement Posting Trigger endpoint (validates status and adds job to queue).
- **T-205**: Implement Configuration endpoints (markup, interval, limits).
- **T-206**: Implement Job History and Log retrieval endpoints.
- **T-207**: Generate OpenAPI/Swagger documentation.

## Definition of Done
- API endpoints respond correctly according to the contract.
- Products can be filtered and managed via API.
- Post action correctly adds jobs to the BullMQ queue in Redis.
- Documentation is accessible at `/docs`.
