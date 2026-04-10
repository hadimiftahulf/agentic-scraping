# API Contract: FB Marketplace Auto Listing Bot

## 1. Product Endpoints

### GET /api/products
- **Description:** List all scraped products.
- **Query Params:**
  - `status`: Filter by status (DRAFT, PROCESSING, POSTED, FAILED).
  - `page`: Pagination page (default 1).
  - `limit`: Items per page (default 20).
- **Response (200 OK):**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "string",
        "price": 150000,
        "status": "DRAFT",
        "createdAt": "iso-date"
      }
    ],
    "meta": { "total": 100, "page": 1, "limit": 20 }
  }
  ```

### GET /api/products/:id
- **Description:** Get detailed product info.
- **Response (200 OK):** Product object with full details and job history.

### POST /api/products/:id/post
- **Description:** Trigger automated posting for a specific product.
- **Response (202 Accepted):**
  ```json
  { "jobId": "uuid", "message": "Posting job queued." }
  ```

## 2. Config Endpoints

### GET /api/config
- **Description:** Retrieve current system configuration.
- **Response (200 OK):**
  ```json
  {
    "markupPercent": 25,
    "scraperIntervalMinutes": 20,
    "maxPostPerDay": 8
  }
  ```

### PATCH /api/config
- **Description:** Update configuration.
- **Body:** Partial config object.
- **Response (200 OK):** Updated config object.

## 3. Health & Monitoring

### GET /health
- **Description:** Basic health check.
- **Response (200 OK):** `{ "status": "ok" }`
