# Multi-Marketplace Sourcing Technical Design

## 1. Overview

Extending the scraper service to support multiple Indonesian marketplaces beyond Jakartanotebook, enabling product sourcing from the top 4 e-commerce platforms in Indonesia.

## 2. Supported Marketplaces

| Marketplace     | Monthly Visits | Difficulty       | Key Challenge                                    |
| --------------- | -------------- | ---------------- | ------------------------------------------------ |
| Shopee          | 133.1M         | **Hard (4/5)**   | Mandatory login wall + aggressive fingerprinting |
| Tokopedia       | 71.7M          | **Medium (3/5)** | Cloudflare + Rate limiting                       |
| Lazada          | ~15M           | **Medium (3/5)** | CAPTCHA + IP blocking                            |
| Jakartanotebook | Existing       | Easy             | Current implementation                           |

## 3. Anti-Detection Architecture

### 3.1 Core Defense Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Scraper Service                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌────────────┐ │
│  │ Stealth     │   │ Proxy Pool  │   │ Session    │ │
│  │ Browser    │   │ (Rotating)  │   │ Manager    │ │
│  └─────────────┘   └─────────────┘   └────────────┘ │
│         │                │                 │          │
│         └────────────────┼─────────────────┘          │
│                          ▼                           │
│              ┌───────────────────────┐               │
│              │ Browser Pool       │               │
│              │ (Isolated Contexts) │               │
│              └───────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Implementation Requirements

| Layer              | Technology                   | Purpose                         |
| ------------------ | ---------------------------- | ------------------------------- |
| Browser Automation | Playwright + stealth plugins | Bypass webdriver detection      |
| Proxy Rotation     | Residential/Mobile IPs       | Avoid rate limiting             |
| Session Management | Encrypted cookie storage     | Maintain auth state             |
| CAPTCHA Handling   | API service (2Captcha)       | Solve challenges when triggered |

### 3.3 Per-Marketplace Requirements

#### Shopee (Highest Difficulty)

- **Required**: Authenticated session (login+OTP persisted)
- **Proxy**: Residential or Mobile (Indonesian IPs only)
- **Rate Limit**: Max 15 requests/minute per IP
- **Fingerprint**: Non-headless recommended for first run
- **Detection Vectors**:
  - `navigator.webdriver` flag
  - Canvas/WebGL fingerprinting
  - Mouse movement patterns
  - Request timing analysis

#### Tokopedia (Medium)

- **Required**: Cloudflare bypass capability
- **Proxy**: Residential (Indonesia)
- **Rate Limit**: 20-30 requests/minute
- **Detection Vectors**:
  - Cloudflare JavaScript challenge
  - Rate limiting

#### Lazada (Medium)

- **Required**: CAPTCHA solving capability
- **Proxy**: Residential
- **Rate Limit**: 20 requests/minute

#### Jakartanotebook (Existing - Easy)

- **Current**: No changes required
- **Use As**: Fallback / Low-priority source

## 4. Data Model Extension

### 4.1 Source Configuration

```yaml
sources:
  - id: "jakartanotebook_default"
    name: "Jakartanotebook"
    enabled: true
    priority: 1
    url_pattern: "https://www.jakartanotebook.com/*"

  - id: "shopee_id"
    name: "Shopee Indonesia"
    enabled: false # Requires auth setup
    priority: 2
    requires_auth: true
    url_pattern: "https://shopee.co.id/*"
    proxy_region: "ID"

  - id: "tokopedia_id"
    name: "Tokopedia"
    enabled: false
    priority: 3
    requires_auth: false
    url_pattern: "https://www.tokopedia.com/*"
    proxy_region: "ID"

  - id: "lazada_id"
    name: "Lazada Indonesia"
    enabled: false
    priority: 4
    requires_auth: false
    url_pattern: "https://www.lazada.co.id/*"
    proxy_region: "ID"
```

### 4.2 Product Source Tracking

```sql
-- Extend Product table
ALTER TABLE Product ADD COLUMN source_marketplace VARCHAR(50);
ALTER TABLE Product ADD COLUMN source_url TEXT;
ALTER TABLE Product ADD COLUMN source_listing_id VARCHAR(255);
ALTER TABLE Product ADD COLUMN last_scraped_at TIMESTAMP;

-- New table: Source Configuration
CREATE TABLE source_config (
    id UUID PRIMARY KEY,
    marketplace_id VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    priority INTEGER,
    requires_auth BOOLEAN DEFAULT false,
    last_scrape_at TIMESTAMP,
    scrape_interval_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Scraping Strategy

### 5.1 Priority Queue

1. **Jakartanotebook** (Primary - existing)
   - No auth required
   - Most reliable for accessories/gadgets

2. **Shopee** (High Priority - but requires setup)
   - Best product variety
   - Requires: authenticated session + proxy

3. **Tokopedia** (Medium Priority)
   - Large electronics selection
   - Requires: Cloudflare bypass

4. **Lazada** (Fallback)
   - Official brand stores
   - Good for warranty items

### 5.2 Fallback Logic

```
IF scrape fails on primary:
  → Retry with backoff (1min, 5min, 15min)
  → IF still fails: move to next priority source
  → Mark source as degraded in source_config
```

## 6. Session Management

### 6.1 Auth State Storage

| Marketplace | Session Type           | Storage        | Renewal           |
| ----------- | ---------------------- | -------------- | ----------------- |
| Shopee      | Cookies + LocalStorage | Encrypted file | Manual            |
| Tokopedia   | Cookies                | Encrypted file | Auto (Cloudflare) |
| Lazada      | Cookies                | Encrypted file | Auto              |

### 6.2 Encrypted Session Format

```json
{
  "marketplace": "shopee",
  "cookies": [...],
  "local_storage": {...},
  "proxy_used": "residential-id-xxx",
  "expires_at": "2026-04-15T00:00:00Z",
  "last_validated": "2026-04-11T00:00:00Z"
}
```

## 7. Technical Implementation

### 7.1 Scraper Interface

```typescript
interface ISourceScraper {
  readonly marketplace: string;
  readonly requiresAuth: boolean;

  login(sessionPath: string): Promise<void>;
  scrapeList(category: string, limit: number): Promise<ScrapedProduct[]>;
  scrapeDetail(productUrl: string): Promise<ProductDetail>;
  healthCheck(): Promise<boolean>;
}
```

### 7.2 Factory Pattern

```
ScraperFactory
  ├── JakartanotebookScraper (current)
  ├── ShopeeScraper (requires auth)
  ├── TokopediaScraper (requires cloudflare bypass)
  └── LazadaScraper
```

### 7.3 Health & Monitoring

| Metric             | Threshold       | Action                  |
| ------------------ | --------------- | ----------------------- |
| Success rate       | < 80%           | Alert + disable source  |
| Auth failures      | > 3 consecutive | Alert + require re-auth |
| CAPTCHAs triggered | > 10/hour       | Backoff + human handoff |
| Response time      | > 30s           | Retry with new proxy    |

## 8. Risk Assessment

| Marketplace     | Technical Risk | Legal Risk | Operational Risk     |
| --------------- | -------------- | ---------- | -------------------- |
| Jakartanotebook | Low            | Low        | Low (existing)       |
| Shopee          | **High**       | Medium     | **High** (auth mgmt) |
| Tokopedia       | Medium         | Medium     | Medium               |
| Lazada          | Medium         | Medium     | Medium               |

## 9. Roadmap

### Phase 1 (Current Sprint)

- Keep Jakartanotebook as primary source
- Document scraping requirements for others

### Phase 2 (V1.1 - Optional)

- Add Shopee support if authenticated sessions available
- Requires: session setup + residential proxy budget

### Phase 3 (V1.2 - Future)

- Tokopedia + Lazada integration
- Requires: proxy service subscription

## 10. Decision Required

**Key Decision**: Should we invest in multi-marketplace scraping?

### Pros

- More product variety
- Better stock availability
- Price comparison across platforms

### Cons

- **Shopee**: Requires authenticated sessions (high maintenance)
- Additional cost: Proxy service ($50-100/month)
- Technical complexity: Multiple anti-detection strategies

### Recommendation

- **Start with Jakartanotebook only** (current scope)
- **Add Shopee only if user provides authenticated session**
- Keep others as future enhancement

---

_Document Version: 1.0_
_Created: 2026-04-11_
_Last Updated: 2026-04-11_
