# 🏗️ System Design — FB Marketplace Bot

## 1. 🔷 High-Level Architecture

```
[ Scraper (Python) ]
        ↓
     [ DB ]
        ↓
[ Backend API (Node) ] → [ Queue (Redis + BullMQ) ]
        ↓                         ↓
   [ Frontend ]           [ Worker (Posting Bot) ]
                                   ↓
                         :contentReference[oaicite:0]{index=0}
```

---

## 2. 🧩 Service Breakdown

### A. Scraper Service (Python)

- Playwright
- cron job
- output → DB

---

### B. Backend API (Node.js)

- REST API
- trigger posting
- handle config (margin, filter)

---

### C. Worker (Node.js)

- consume queue
- run Playwright (posting bot)
- retry + logging

---

### D. Frontend (Next.js)

- dashboard produk
- tombol post
- status tracking

---

## 3. 📁 Folder Structure (Monorepo)

```
project-root/
│
├── apps/
│   ├── scraper/        # Python
│   ├── api/            # Node.js (Express/Fastify)
│   ├── worker/         # Node.js (BullMQ)
│   └── web/            # Next.js
│
├── packages/
│   ├── db/             # Prisma schema
│   ├── utils/          # shared helper
│   └── config/         # env config
│
├── infra/
│   ├── docker/
│   └── redis/
```

---

## 4. 🔄 Data Flow Detail

### Scraping Flow

1. hit Jakartanotebook
2. parse produk
3. generate hash
4. upsert DB

---

### Posting Flow

1. user klik / scheduler
2. API → push job
3. Worker ambil job
4. Playwright:
   - open FB
   - upload image (watermark)
   - isi form

5. update status

---

## 5. ⚙️ Key Design Decisions

### Kenapa Pisah Worker?

- isolate bot (biar ga crash API)
- scalable (future multi account)

---

### Kenapa Queue?

- retry otomatis
- kontrol rate (anti ban)
- delay random

---

### Kenapa Monorepo?

- reusable (config, db schema)
- maintainable

---

## 6. 🔐 Sensitive Handling (IMPORTANT)

- session FB → simpan di file encrypted
- jangan commit cookies
- env:

```
FB_SESSION_PATH=
REDIS_URL=
DATABASE_URL=
```

---

## 7. ⚠️ Anti-Detection Strategy

- delay random (2–10s)
- scroll before click
- typing simulation
- max 5–10 post/day

---

## 8. 🚀 Scaling Path (Future)

- multi akun (queue per account)
- proxy rotation
- AI caption generator

---
