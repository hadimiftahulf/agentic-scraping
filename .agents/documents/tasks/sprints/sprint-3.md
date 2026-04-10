# Sprint 3: Posting Bot (Worker Service)

**Goal:** Automate the Facebook Marketplace listing process with human-like behavior and session management.

## Tasks
- **T-301**: Setup Worker project in `apps/worker` with BullMQ consumer.
- **T-302**: Implement Facebook Login & Encrypted Session Persistence.
- **T-303**: Implement Browser Stealth (User-Agent, Viewport, WebRTC leak prevention).
- **T-304**: Implement human-like interaction simulation (Typing, Scrolling, Mouse movement).
- **T-305**: Automate Marketplace Listing Form (Title, Price, Desc, Image upload).
- **T-306**: Implement Success Verification and Error Screenshot capture.
- **T-307**: Implement Daily Posting Rate Limiter (Anti-Ban).

## Definition of Done
- Worker successfully posts a product from the queue to FB Marketplace.
- Success rate >= 80% in controlled tests.
- Status in database is updated to POSTED upon success.
- Screenshots are saved for every failure.
