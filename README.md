# 🤖 FB Marketplace Auto Listing Bot

A full-stack automated bot that scrapes products from JakartaNotebook, processes them, and posts them to Facebook Marketplace automatically.

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Scraper   │──────│   Database   │──────│    API      │
│  (Python)   │      │ (PostgreSQL) │      │  (Node.js)  │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                 │
                        ┌────────────┐          │
                        │   Queue    │◄─────────┘
                        │ (Redis)   │
                        └─────┬──────┘
                              │
                        ┌───────▼───────┐
                        │    Worker     │
                        │  (Playwright) │
                        └───────┬───────┘
                                │
                        ┌───────▼───────┐
                        │  Dashboard    │
                        │   (Next.js)   │
                        └───────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **Python** >= 3.12
- **Docker** & Docker Compose

### 1. Clone & Setup

```bash
git clone <repository-url>
cd agentic-scraping

# Copy environment file
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL
# - REDIS_URL
# - SESSION_ENCRYPT_KEY (generate with: openssl rand -base64 32)
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all

# Install Python dependencies
cd apps/scraper
pip install -r requirements.txt
```

### 4. Run Database Migrations

```bash
cd packages/db
npx prisma migrate dev
```

### 5. Setup Facebook Session (First Time Only)

```bash
cd apps/worker
npm run setup:session
```

This will:
1. Open a browser window
2. Navigate to Facebook
3. Prompt you to login manually
4. Save encrypted session to disk

### 6. Start All Services

```bash
# Start everything with Docker
docker-compose up -d

# Or start individually:
# Terminal 1: API
cd apps/api && npm run dev

# Terminal 2: Worker
cd apps/worker && npm run dev:with-health

# Terminal 3: Dashboard
cd apps/web && npm run dev

# Terminal 4: Scraper (optional, can run via Docker)
cd apps/scraper && python -m scraper
```

### 7. Access Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
agentic-scraping/
├── apps/
│   ├── api/           # REST API (Express + TypeScript)
│   ├── scraper/       # Product scraper (Python + Playwright)
│   ├── worker/        # Posting worker (Playwright + BullMQ)
│   └── web/          # Dashboard (Next.js 14)
├── packages/
│   ├── config/        # Shared configuration
│   ├── db/           # Prisma database client
│   └── utils/        # Shared utilities
├── scripts/
│   └── e2e-test.sh   # End-to-end integration test
└── docker-compose.yml
```

## 🔧 Environment Variables

### Required

```env
# Database
DATABASE_URL="postgresql://botuser:botpassword@localhost:5432/botdb"

# Redis
REDIS_URL="redis://localhost:6379"

# Facebook Session
SESSION_ENCRYPT_KEY="your-32-byte-encryption-key"
FB_SESSION_PATH="./session/fb_session.json"
```

### Optional

```env
# API
PORT=3001
NODE_ENV=development
CORS_ORIGINS="http://localhost:3000"

# Scraper
TARGET_URL="https://www.jakartanotebook.com/category/laptop"
SCRAPER_INTERVAL_MINUTES=20
PRICE_MARKUP_PERCENT=25
MIN_PRICE=0
MAX_PRICE=50000000
BLACKLIST_KEYWORDS="bundle,rusak,damaged"

# Posting
MAX_POST_PER_DAY=8
POST_DELAY_SECONDS=300

# Dashboard
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Telegram (Optional)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

## 🧪 Testing

### Run E2E Test

```bash
chmod +x scripts/e2e-test.sh
./scripts/e2e-test.sh
```

This will:
1. Start all services
2. Verify health checks
3. Run scraper cycle
4. Check database
5. Test API endpoints
6. Generate test report

### Unit Tests

```bash
# Worker tests
cd apps/worker
npm test

# API tests (if implemented)
cd apps/api
npm test
```

## 🐛 Troubleshooting

### Session Expired

If you see "Session expired" errors:

```bash
cd apps/worker
npm run setup:session
```

### Captcha Detected

When captcha is detected:
1. Check `./screenshots/` for the captcha screenshot
2. Manually complete the captcha in the browser
3. Worker will resume after 30 minutes

### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart if needed
docker-compose restart postgres
```

## 🔒 Security

- **No hardcoded credentials**: All sensitive data in environment variables
- **Encrypted sessions**: Facebook sessions encrypted with AES-256
- **Input validation**: All API inputs validated with Zod
- **Rate limiting**: API rate limits configured
- **SQL injection prevention**: All queries via Prisma (parameterized)

## 📊 Monitoring

### Health Checks

- **API**: `GET http://localhost:3001/health`
- **Worker**: `GET http://localhost:3002/health`
- **Detailed**: `GET http://localhost:3001/health/detailed`

### Logs

All services use structured JSON logging:
- **API**: Pino logger
- **Worker**: Pino logger
- **Scraper**: Python structlog

## 🚀 Deployment

### Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Individual Services

Each service has its own Dockerfile:

```bash
# API
docker build -t fb-bot-api apps/api
docker run -p 3001:3001 fb-bot-api

# Worker
docker build -t fb-bot-worker apps/worker
docker run -p 3002:3002 fb-bot-worker

# Dashboard
docker build -t fb-bot-web apps/web
docker run -p 3000:3000 fb-bot-web
```

## 📝 Development

### API Development

```bash
cd apps/api
npm run dev
```

### Worker Development

```bash
cd apps/worker
npm run dev:with-health
```

### Dashboard Development

```bash
cd apps/web
npm run dev
```

### Scraper Development

```bash
cd apps/scraper
python -m scraper --single-run
```

## 📚 Documentation

- [Sprint 1](doc/task/sprint-1.md) - Product Scraper
- [Sprint 2](doc/task/sprint-2.md) - Product Processing
- [Sprint 3](doc/task/sprint-3.md) - Posting Bot
- [Sprint 4](doc/task/sprint-4.md) - Frontend Dashboard
- [Sprint 5](doc/task/sprint-5.md) - Integration & QA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This bot is for educational purposes only. Use responsibly and comply with Facebook's Terms of Service. The authors are not responsible for any misuse or account bans.
