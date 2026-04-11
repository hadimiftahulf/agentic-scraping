# API Specification: Product Management (JSON:API)

## 1. Endpoints

### GET /api/products

- **Description:** List all scraped products with filtering and pagination.
- **Headers:** `Accept: application/vnd.api+json`
- **Query Params:**
  - `filter[status]`: Filter by status (DRAFT, PROCESSING, POSTED, FAILED).
  - `page[number]`: Page number (default 1).
  - `page[size]`: Items per page (default 20).
- **Response (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "total-results": 100,
    "total-pages": 5
  },
  "data": [
    {
      "type": "products",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "attributes": {
        "title": "Laptop ASUS VivoBook 14",
        "price": 1250000,
        "status": "DRAFT",
        "createdAt": "2026-04-10T10:00:00Z"
      },
      "links": {
        "self": "/api/products/550e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "links": {
    "self": "/api/products?page[number]=1",
    "next": "/api/products?page[number]=2",
    "last": "/api/products?page[number]=5"
  }
}
```

### GET /api/products/:id

- **Description:** Get single product details including its posting history (jobs).
- **Response (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "products",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "attributes": {
      "title": "Laptop ASUS VivoBook 14",
      "price": 1250000,
      "description": "Powerful laptop...",
      "imageUrl": "https://source.url/img.jpg",
      "status": "DRAFT"
    },
    "relationships": {
      "jobs": {
        "links": {
          "related": "/api/products/550e8400-e29b-41d4-a716-446655440000/jobs"
        }
      }
    }
  }
}
```

### POST /api/products/:id/post

- **Description:** Trigger an asynchronous posting job.
- **Response (202 Accepted):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "message": "Posting job has been queued.",
    "jobId": "770e8400-e29b-41d4-a716-446655449999"
  }
}
```

## 2. Error Dictionary

All errors follow the JSON:API error object structure.

| HTTP Code | Error Code       | Detail                                         |
| --------- | ---------------- | ---------------------------------------------- |
| 404       | NOT_FOUND        | The requested product does not exist.          |
| 409       | INVALID_STATE    | Product is already 'PROCESSING' or 'POSTED'.   |
| 422       | VALIDATION_ERROR | Provided query parameters or body are invalid. |

**Example Error Response:**

```json
{
  "jsonapi": { "version": "1.1" },
  "errors": [
    {
      "status": "409",
      "code": "INVALID_STATE",
      "title": "Conflict",
      "detail": "Product cannot be posted because its current status is PROCESSING."
    }
  ]
}
```
