# Business Requirements Document: FB Marketplace Auto Listing Bot

## 1. Problem Statement
Manual listing of products to Facebook Marketplace is a time-consuming and repetitive process for personal sellers. Existing manual methods require significant effort to scrape product details, process images, and manage listings, leading to inefficiency and limiting the seller's ability to scale their business.

## 2. Target User Persona: "Budi, the Side-Hustle Seller"
- **Demographics:** Indonesian, 25-40 years old, working a 9-5 job.
- **Goals:** Earn extra income by dropshipping products from Jakartanotebook to FB Marketplace with minimal manual effort.
- **Frustrations:** Spends too much time manually copying product titles, descriptions, and downloading/editing images. Listing 5 items takes an hour.
- **Behaviors:** Uses a personal Facebook account for selling. Prefers simple, automated tools that don't require coding knowledge.

## 3. Value Proposition
For personal sellers who want to scale their FB Marketplace sales without the manual grind, FB Marketplace Auto Listing Bot is an automated listing tool that scrapes, processes, and posts products from Jakartanotebook in minutes, unlike manual listing or generic scrapers which lack integrated image processing and direct FB Marketplace automation.

## 4. Assumption Map
| Assumption | Risk Level | Validation Experiment |
|------------|------------|-----------------------|
| Playwright can automate FB Marketplace without immediate bans. | High | Pilot script posting 1 item/day for 3 days. |
| Jakartanotebook structure remains stable for scraping. | Medium | Weekly automated tests for scraper health. |
| Users are willing to provide FB sessions/cookies. | Medium | User survey / First-time setup flow feedback. |

## 5. Feasibility Assessment
- **Technical:** Playwright + Python/Node is highly feasible for browser automation.
- **Financial:** Low overhead (personal use).
- **Time:** Development estimated at 10 weeks (as per raw docs).
- **Verdict:** Go.

## 6. Scoped Feature List (MoSCoW)
### Must-Haves
- Jakartanotebook product scraper (listing & detail).
- Image processor (resize 1:1, watermark text/logo).
- FB Marketplace posting engine (Playwright).
- Dashboard UI (Next.js) for product management.
- Duplicate detection (hash-based).

### Should-Haves
- Random delays and human-like interaction simulation.
- Multi-image support (up to 5 images).

### Could-Haves
- Auto-reply for marketplace messages.
- AI-based description generation.

### Won't-Haves (V1)
- Multi-account support.
- Support for other marketplaces.
