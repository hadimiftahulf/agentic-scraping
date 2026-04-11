# ADR-003: Playwright over Selenium for Browser Automation

## Context

We need a browser automation tool for both scraping Jakartanotebook and posting to Facebook Marketplace.

## Decision

We will use **Playwright** as the sole browser automation tool for all scraping and posting tasks.

## Alternatives Considered

- **Selenium:** Mature but slower, less reliable for modern SPAs, requires separate drivers.
- **Puppeteer:** Good for Chrome but has limited cross-browser support.
- **Python Playwright:** Good but introduces language fragmentation (see ADR-001).

## Consequences

- **Single Tool:** One library to learn, maintain, and configure.
- **Stealth:** Playwright has built-in stealth plugins that override webdriver detection.
- **TypeScript Native:** Full TypeScript support with auto-complete and type guards.
- **Cross-Browser:** Supports Chromium, Firefox, and WebKit from a single API.
- **Reliability:** Built-in wait mechanisms and auto-retry reduce flakiness.
