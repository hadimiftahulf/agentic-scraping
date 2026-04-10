# Internal Interface: Jakartanotebook Sourcing

## 1. Data Contract: Scraped Product
This is the internal data structure returned by the Detail Scraper before processing.

```json
{
  "title": "Laptop ASUS VivoBook 14",
  "rawPrice": 1250000,
  "description": "Powerful laptop for daily use...",
  "images": [
    "https://jakartanotebook.com/img/p1.jpg",
    "https://jakartanotebook.com/img/p2.jpg"
  ],
  "sourceUrl": "https://jakartanotebook.com/p/asus-vivobook-14",
  "inStock": true
}
```

## 2. Validation Rules
| Field | Type | Required | Constraint |
|-------|------|----------|------------|
| title | string | Yes | Min 5 chars, Max 255 |
| rawPrice | integer | Yes | > 0 |
| description | string | Yes | Max 2000 chars |
| images | array | Yes | Min 1 element |
| sourceUrl | string | Yes | Valid URL |

## 3. Error Dictionary
| Code | Message | Description |
|------|---------|-------------|
| SCRAPE_404 | Source Not Found | Product URL returned 404. |
| SCRAPE_TIMEOUT | Timeout | Page load took longer than 30s. |
| IMAGE_PROC_FAIL | Image Processing Failed | Sharp failed to resize or watermark image. |
