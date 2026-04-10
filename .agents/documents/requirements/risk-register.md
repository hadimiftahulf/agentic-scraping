# Risk Register: Multi-Source Scraper Expansion

| ID | Risk Description | Category | Impact | Likelihood | Mitigation Strategy |
|----|------------------|----------|--------|------------|---------------------|
| **R1** | **Shopee/Tokopedia Anti-Bot Block** | Technical | High | High | Use high-quality residential rotating proxies and Playwright Stealth plugin. Implement "human-like" interaction patterns and delayed retry logic. |
| **R2** | **Marketplace DOM Structure Change** | Operational | Medium | High | Implement automated "Health Check" jobs for each provider. Use robust CSS/XPath selectors and prioritize data from available API/JSON metadata inside page headers. |
| **R3** | **TS Migration Overhead** | Technical | Medium | Medium | Implement the new scraper as a separate Node.js service (`apps/scraper-ts`) and phase out the Python version incrementally. Share existing `packages/db` and `packages/utils`. |
| **R4** | **High Proxy Costs** | Financial | Medium | Medium | Optimize scraping frequency (e.g., sync only active products). Monitor proxy usage per user/session to detect abuse. |
| **R5** | **Storage Scarcity** | Operational | Medium | Low | Implement an automated cleanup script for old/unused images. Use S3-compatible storage if local disk usage exceeds 80%. |
| **R6** | **TikTok Shop Hidden Metadata** | Technical | Medium | Medium | Research mobile-app fingerprinting or reverse-engineer private API endpoints if the web-frontend is too heavily obfuscated. |
| **R7** | **Account Ban (Facebook)** | Business | High | Low | (Not directly related to scraper, but critical for the bot as a whole). Keep posting delays conservative (AC-NF-02) and avoid scraping too many products at once. |

**Risk Management Owner: Lead Developer / Architect**
**Review Frequency: Weekly Sprint Review**
