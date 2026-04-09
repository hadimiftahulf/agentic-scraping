# Scraper Service

Python service untuk scrape produk dari Jakartanotebook dan simpan ke database.

## Struktur Folder

```
apps/scraper/
├── src/
│   ├── scraper/        # Scraping logic
│   ├── processor/      # Data & image processing
│   ├── db/             # Database client
│   └── config.py       # Environment config
├── main.py            # Entry point
├── Dockerfile         # Container image
├── requirements.txt    # Python dependencies
└── README.md
```

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Copy environment variables
cp ../../.env.example ../../.env
# Edit .env with your DATABASE_URL

# Run scraper
python main.py
```

### Docker

```bash
# Build image
docker build -t fb-bot-scraper .

# Run container
docker run --env-file ../../.env fb-bot-scraper
```

## Configuration

Environment variables (lihat `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `TARGET_URL` | URL to scrape | https://www.jakartanotebook.com/category/laptop |
| `SCRAPER_INTERVAL_MINUTES` | Scrape interval (minutes) | 20 |
| `PRICE_MARKUP_PERCENT` | Price markup % | 25 |
| `MIN_PRICE` | Minimum price filter | 0 |
| `MAX_PRICE` | Maximum price filter | 50000000 |
| `BLACKLIST_KEYWORDS` | Keywords to skip | - |

## Logging

Structured JSON logging ke stdout untuk integrasi dengan container logs:

```json
{
  "timestamp": "2024-04-09T21:00:00Z",
  "level": "INFO",
  "message": "Scraping cycle started",
  "event": "scrape_start"
}
```

## Troubleshooting

### Playwright browser not found
```bash
playwright install chromium
```

### Database connection error
- Verify DATABASE_URL format
- Ensure PostgreSQL is accessible
- Check firewall rules

### Rate limiting
- Adjust delays in `src/scraper/listing_scraper.py`
- Configure proper intervals via env variables
