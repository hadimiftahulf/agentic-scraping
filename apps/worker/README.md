# Worker Service

FB Marketplace Auto Posting Worker - processes jobs from BullMQ queue and posts products to Facebook Marketplace.

## Features

- Automated product posting to Facebook Marketplace
- Session persistence with encryption
- Anti-detection browser stealth
- Daily rate limiting
- Automatic retry on failure
- Captcha detection and handling

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## Environment Variables

See `.env.example` for required environment variables.

## Architecture

- `worker.ts` - Main entry point
- `processors/` - BullMQ job processors
- `bot/` - Browser automation and Facebook interaction
- `services/` - Business logic services
