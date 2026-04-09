# Backend API Service

Fastify-based REST API untuk managing products dan triggering Facebook Marketplace posts.

## Struktur Folder

```
apps/api/
├── src/
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── schemas/        # Zod validation schemas
│   ├── middleware/      # Error handling
│   ├── plugins/        # Fastify plugins
│   └── index.ts       # Entry point
├── Dockerfile         # Container image
├── tsconfig.json     # TypeScript config
└── package.json
```

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run API
npm run dev
```

### Docker

```bash
# Build image
docker build -t fb-bot-api .

# Run container
docker run --env-file ../../.env -p 3001:3001 fb-bot-api
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Products
- `GET /products` - List products (pagination, filter by status)
- `GET /products/:id` - Get product detail
- `POST /products/:id/post` - Trigger posting for product
- `POST /products/batch-post` - Batch post multiple products
- `GET /products/:id/jobs` - Get job history for product

### Jobs
- `GET /jobs` - List all recent jobs
- `GET /jobs/:id` - Get job detail

### Config
- `GET /config` - Get current configuration
- `PATCH /config` - Update configuration

### Documentation
- `GET /docs` - Swagger UI (development only)

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `PORT` | API port | 3001 |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3000 |
| `NODE_ENV` | Environment | development |

## Error Handling

Standard error format:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "statusCode": 404
  }
}
```

## Queue Integration

API menggunakan BullMQ untuk job queue:
- Queue name: `post_product`
- Job data: `{ productId: string, attempt: number }`
- Retry: 3 attempts dengan exponential backoff
- Delay: 30, 60, 120 seconds antar retry

## Testing

```bash
# Run integration tests
npm run test

# Watch mode
npm run test -- --watch
```
