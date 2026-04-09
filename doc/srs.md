# 📄 SRS — FB Marketplace Auto Listing Bot

## 1. 🧩 System Overview

Sistem terdiri dari 4 service utama:

1. Scraper Service (Python)
2. Backend API (Node.js)
3. Worker/Queue (BullMQ)
4. Frontend Dashboard (Next.js)

Integrasi:

- Source: Jakartanotebook
- Target: Facebook Marketplace

---

## 2. 🔌 Functional Requirements

### FR1 — Scraping

- ambil produk list & detail
- interval configurable (cron)
- retry jika gagal

---

### FR2 — Data Processing

- normalize price (int)
- markup configurable
- filter (keyword, min/max price)

---

### FR3 — Image Processing

- download image
- resize (1:1)
- watermark (text/logo, configurable path)

---

### FR4 — Product Management API

Endpoint:

```http
GET /products
POST /products/:id/post
GET /products/:id
```

Field:

```json
{
  "id": "uuid",
  "title": "string",
  "price": 100000,
  "image": "url",
  "status": "draft|posted|failed",
  "hash": "string"
}
```

---

### FR5 — Posting Engine

- login session persistent
- upload image
- isi form (title, price, desc)
- submit
- update status

Mode:

- manual trigger
- auto (queue + scheduler)

---

### FR6 — Queue System

- job: `post_product`
- retry: 3x
- delay random (anti detection)

---

### FR7 — Dashboard

- list produk
- filter status
- tombol post

---

## 3. 🗄️ Data Model

### Table: products

```sql
id UUID PK
title TEXT
price INT
image TEXT
hash TEXT UNIQUE
status TEXT
created_at TIMESTAMP
```

---

### Table: jobs (optional log)

```sql
id UUID
product_id UUID
status TEXT
log TEXT
```

---

## 4. ⚙️ Non-Functional Requirements

### Performance

- scrape ≤ 5s/page
- post ≤ 60s/item

### Reliability

- retry mechanism
- fail-safe logging

### Security

- FB session disimpan local (encrypted)
- no hardcode credential

---

## 5. ⚠️ Constraints

- UI Facebook Marketplace bisa berubah
- harus mimic human behavior
- max post/day dibatasi (5–10)

---

## 6. 🔄 Sequence Flow (Posting)

1. user klik post / auto trigger
2. backend push job → queue
3. worker ambil job
4. Playwright buka browser
5. upload + submit
6. update status

---

## 7. 🧪 Edge Cases

- image gagal download
- captcha muncul
- produk duplicate
- harga berubah

---
