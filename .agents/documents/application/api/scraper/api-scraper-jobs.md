# API: Scraper Manual Trigger

Trigger a manual scrape cycle for a specific URL or marketplace.

## 1. POST /api/scraper/jobs

Trigger a new scraping job.

### Request Body
```json
{
  "data": {
    "type": "scraper-jobs",
    "attributes": {
      "url": "https://www.tokopedia.com/p/laptop",
      "provider": "tokopedia",
      "depth": "listing"
    }
  }
}
```

- `url`: The target marketplace URL.
- `provider`: (Optional) Force a specific provider (`tokopedia`, `shopee`, `jakartanotebook`).
- `depth`: `listing` to discover products, `detail` to scrape a single product.

### Success Response
**Status: 202 Accepted**
```json
{
  "data": {
    "type": "scraper-jobs",
    "id": "job_12345",
    "attributes": {
      "status": "queued",
      "createdAt": "2026-04-10T18:00:00Z"
    }
  }
}
```

## 2. GET /api/scraper/jobs/:id

Check the status of a scraper job.

### Success Response
**Status: 200 OK**
```json
{
  "data": {
    "type": "scraper-jobs",
    "id": "job_12345",
    "attributes": {
      "status": "completed",
      "processedCount": 24,
      "errorCount": 0,
      "logs": "Scrape completed successfully."
    }
  }
}
```

## 3. Error Codes
- `422 Unprocessable Entity`: Invalid URL or unsupported marketplace.
- `429 Too Many Requests`: Scraper rate limit reached.
