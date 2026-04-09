# 📄 PRD — FB Marketplace Auto Listing Bot

## 1. 🎯 Objective

Membangun sistem otomatis untuk:

- scrape produk dari Jakartanotebook
- proses (markup + watermark)
- posting ke Facebook Marketplace
  dengan mode **semi-auto & full-auto (controlled)**

---

## 2. 👤 Target User

- Personal seller (1 akun FB)
- Non-technical / semi-technical user

---

## 3. ⚙️ Core Features

### F1 — Product Scraper

- ambil: title, price, image, desc, stock
- schedule scraping (10–30 menit)
- cache & deduplication

---

### F2 — Product Processing

- auto markup price (% configurable)
- filter produk (keyword, price range)
- normalize data

---

### F3 — Image Processing

- auto download image
- resize (square)
- watermark (logo/text configurable)

---

### F4 — Marketplace Posting

Mode:

- **Semi-auto**: klik dari dashboard
- **Full-auto**: queue + scheduler

Include:

- upload image
- set title, price, desc

---

### F5 — Dashboard (Next.js)

- list produk hasil scrape
- tombol “Post”
- status: draft / posted / failed

---

### F6 — Cache & Sync

- hash produk (title+price)
- skip duplicate
- update jika berubah

---

### F7 — Basic Auto Reply (Optional V1.1)

- keyword reply (manual trigger / semi-auto)

---

## 4. 🚫 Non-Goals (V1)

- multi akun
- multi marketplace
- AI content generator kompleks
- analytics advanced

---

## 5. ⚠️ Constraints

- tidak ada API resmi dari Facebook Marketplace
- wajib pakai browser automation (Playwright)
- risk: ban / captcha / UI change

---

## 6. 📊 Success Metrics

- ≥80% post berhasil tanpa error
- ≤5% duplicate post
- waktu posting < 60 detik/item

---

## 7. 🔄 User Flow (Simplified)

1. scraper jalan → data masuk DB
2. user buka dashboard
3. pilih produk → klik “Post”
4. bot buka FB → posting → update status

---

## 8. 🧩 High-Level Tech Stack

- Scraper: Python + Playwright
- Backend: Node.js (API + queue)
- Frontend: Next.js
- DB: PostgreSQL / SQLite
- Queue: Redis + BullMQ

---
