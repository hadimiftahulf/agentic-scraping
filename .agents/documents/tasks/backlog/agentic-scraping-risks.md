# Risk Register: FB Marketplace Auto Listing Bot

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy |
|---------|-------------|------------|--------|---------------------|
| R-01 | Facebook Account Ban | High | High | Use random delays, human typing simulation, and limit daily posts. |
| R-02 | Scraper Failure (UI Change) | Medium | Medium | Use robust selectors, implement automated tests for scraper health, and alert developer. |
| R-03 | Captcha Detection | Medium | Medium | Implement manual session setup script and pause bot when captcha is detected. |
| R-04 | Image Download Timeout | Low | Low | Implement retry logic with `tenacity` or similar. |
| R-05 | Database Synchronization Error | Low | Medium | Use hash-based deduplication and transaction-safe upserts. |
