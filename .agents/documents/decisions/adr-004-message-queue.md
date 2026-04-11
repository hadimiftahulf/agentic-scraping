# ADR-004: Message Queue - BullMQ with Redis

## Context

The posting worker needs a queue to manage job execution, retries, and concurrency limits.

## Decision

We will use **BullMQ** backed by **Redis** for job queuing.

## Alternatives Considered

- **RabbitMQ:** More features but more complex setup and operation.
- **AWS SQS:** Requires cloud credentials, less local development flexibility.
- **In-Memory Only:** Not durable, loses jobs on restart.

## Consequences

- **Redis Already Required:** Redis is needed for session caching anyway.
- **BullMQ Features:** Built-in retry with exponential backoff, delayed jobs, and rate limiting.
- **Dashboard:** BullMQ UI provides job monitoring during development.
- **Horizontal Scaling:** Multiple workers can consume from the same queue.
