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

## Session Setup

Before running the worker, you need to set up a Facebook session:

```bash
# Run session setup script (opens browser for manual login)
npm run setup:session
```

This will:

1. Open a browser window (headed mode)
2. Navigate to Facebook
3. Prompt you to log in manually
4. Save the encrypted session to the configured path

If your session expires, re-run the setup script to refresh it.

## Architecture

- `worker.ts` - Main entry point
- `processors/` - BullMQ job processors
- `bot/` - Browser automation and Facebook interaction
- `services/` - Business logic services
