# 🔒 Sprint 5 — Integration, QA & Hardening

**Durasi:** 1 minggu  
**Goal:** Semua service terintegrasi end-to-end, bug kritis terselesaikan, siap digunakan secara nyata.

---

## 🎯 Sprint Goal

> Jalankan satu `docker-compose up` → scraper ambil data → user klik Post dari dashboard → produk muncul di Facebook Marketplace.

---

## 📋 Task List

### TASK-501 — End-to-End Integration Test
**Estimasi:** 6 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Verifikasi seluruh flow berjalan dari scraper sampai posting, tanpa intervensi manual.

**Acceptance Criteria:**
- [ ] Jalankan `docker-compose up -d` → semua service healthy
- [ ] Tunggu scraper satu siklus → produk muncul di DB (status: DRAFT)
- [ ] Buka dashboard → produk tampil
- [ ] Klik "Post" pada satu produk → status berubah PROCESSING → POSTED
- [ ] Verifikasi job log tercatat di tabel `Job`
- [ ] Tidak ada error 500 dari API selama flow berlangsung
- [ ] Checklist flow:
  ```
  [ ] docker-compose up → semua service healthy
  [ ] scraper siklus pertama → DB berisi produk
  [ ] dashboard load → produk tampil
  [ ] klik Post → PROCESSING
  [ ] worker posting → POSTED
  [ ] logs tampil di dashboard
  ```

---

### TASK-502 — Health Check & Monitoring Endpoints
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Tambahkan health check endpoint yang komprehensif di API agar Docker/orchestrator bisa monitor kondisi service.

**Acceptance Criteria:**
- [ ] `GET /health` — basic (sudah ada)
- [ ] `GET /health/detailed` — cek semua dependency:
  ```json
  {
    "status": "healthy",
    "checks": {
      "database": { "status": "ok", "latencyMs": 3 },
      "redis": { "status": "ok", "latencyMs": 1 },
      "queue": { "status": "ok", "pendingJobs": 2 }
    },
    "uptime": 3600,
    "version": "1.0.0"
  }
  ```
- [ ] Return 503 jika salah satu dependency down
- [ ] Worker expose `/health` di port terpisah (HTTP server minimalis)
- [ ] Scraper expose health via file sentinel (`/tmp/scraper.alive`)
- [ ] Docker health check menggunakan endpoint ini

---

### TASK-503 — Structured Logging & Error Tracking
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Pastikan semua service punya logging terstruktur yang konsisten dan mudah di-debug.

**Acceptance Criteria:**
- [ ] **API & Worker**: Pino logger dengan format JSON
  - Level: `trace | debug | info | warn | error | fatal`
  - Fields wajib: `timestamp`, `service`, `level`, `message`, `traceId`
  - Request log: method, url, statusCode, responseTime
- [ ] **Scraper**: Python `structlog` dengan output JSON
  - Fields: `timestamp`, `level`, `event`, `product_url`, `error`
- [ ] Error log wajib include `stack` (server-side only, bukan response)
- [ ] `traceId` propagasi dari API ke Worker via job data
- [ ] Screenshot on failure tersimpan di `./logs/screenshots/` dengan nama `{traceId}-{timestamp}.png`

---

### TASK-504 — Session Setup & First Login Flow
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Dokumentasi dan tooling untuk first-time FB login agar user non-technical bisa melakukannya.

**Acceptance Criteria:**
- [ ] Script `apps/worker/scripts/setup-session.ts`:
  - Buka browser (headed mode, bukan headless)
  - Navigasi ke Facebook
  - Prompt di terminal: "Silakan login manual di browser yang terbuka, lalu tekan Enter..."
  - Setelah Enter: save session ke `FB_SESSION_PATH`
  - Verifikasi session valid
- [ ] Script dijalankan: `npm run setup:session -w apps/worker`
- [ ] README worker menjelaskan step-by-step dengan screenshot
- [ ] Session file terenkripsi AES-256 (key dari env `SESSION_ENCRYPT_KEY`)
- [ ] Jika session expired: log warning + instruksi re-run script

---

### TASK-505 — Anti-Detection Final Hardening
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Review dan perkuat semua mekanisme anti-deteksi sebelum production.

**Acceptance Criteria:**
- [ ] Browser fingerprint test: jalankan bot ke `https://bot.sannysoft.com/` — tidak ada flag merah
- [ ] Semua aksi bot punya delay random (tidak ada aksi instan)
- [ ] Typing simulation: delay per karakter 50-150ms, pause antar kata 100-300ms
- [ ] Mouse movement: gerakkan ke elemen sebelum klik
- [ ] Scroll page sebelum mengisi form
- [ ] Random order pengisian field (title dulu atau price dulu, random)
- [ ] Interval posting: minimum 5 menit antar posting (configurable)
- [ ] Max post per sesi: 3 (lalu browser di-restart)
- [ ] Captcha detection aktif di setiap navigasi

---

### TASK-506 — Security Audit
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Review keamanan menyeluruh sebelum digunakan dengan akun Facebook nyata.

**Checklist:**
- [ ] **Tidak ada credential hardcoded** — grep di seluruh codebase: `git grep -r "password\|secret\|cookie" --include="*.ts" --include="*.py"`
- [ ] **`.gitignore`** — pastikan: `.env`, `session/`, `images/`, `logs/screenshots/` tidak ter-commit
- [ ] **Session file** — terenkripsi, tidak bisa dibaca plaintext
- [ ] **API tidak expose** port publik selama dev (hanya internal Docker network kecuali port 3001)
- [ ] **Rate limiting** di API — max 100 req/menit per IP
- [ ] **Input sanitization** — semua body dari frontend divalidasi Zod
- [ ] **Tidak ada SQL injection** — semua query via Prisma (parameterized)
- [ ] **CORS** — hanya allow origin dari `NEXT_PUBLIC_APP_URL`

---

### TASK-507 — Performance Baseline & Optimization
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Ukur dan optimalkan performa sesuai NFR dari SRS.

**Target dari SRS:**
- Scrape ≤ 5s/page
- Post ≤ 60s/item

**Acceptance Criteria:**
- [ ] Benchmark scraping: ukur waktu scrape 1 halaman listing (target: ≤5s)
- [ ] Benchmark posting: ukur waktu 1 posting end-to-end (target: ≤60s)
- [ ] API response time: `GET /products` ≤ 200ms (dengan 1000 produk di DB)
- [ ] Tambah index DB jika lambat:
  ```sql
  CREATE INDEX idx_products_status ON "Product"(status);
  CREATE INDEX idx_products_created_at ON "Product"("createdAt" DESC);
  ```
- [ ] `GET /products` dengan 1000 records ≤ 200ms
- [ ] Frontend: Lighthouse score ≥ 80 (performance)

---

### TASK-508 — Deduplication & Sync Edge Cases
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Verifikasi dan perkuat logika deduplication sesuai SRS (≤5% duplicate post).

**Acceptance Criteria:**
- [ ] Test: jalankan scraper 2x → tidak ada baris duplikat di DB
- [ ] Test: produk dengan harga berubah → hash berubah → update di DB (bukan insert baru)
- [ ] Produk yang sudah POSTED → scraper tidak reset status ke DRAFT
- [ ] Widget di dashboard: tampilkan "Terakhir discrape: 20 menit lalu"
- [ ] Alert jika scraper tidak berjalan lebih dari 2 jam

---

### TASK-509 — README & Setup Documentation
**Estimasi:** 4 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Dokumentasi lengkap agar project bisa dijalankan oleh orang lain dari nol.

**Acceptance Criteria:**
- [ ] **README.md root** (lengkap):
  - Deskripsi project
  - Prerequisites: Node.js 20, Python 3.12, Docker
  - **Quick Start** (5 langkah):
    ```
    1. cp .env.example .env      # isi DATABASE_URL dan REDIS_URL
    2. docker-compose up -d postgres redis
    3. npm install
    4. npx prisma migrate dev
    5. npm run setup:session -w apps/worker   # login FB sekali
    6. docker-compose up -d
    ```
  - Environment variables dijelaskan satu per satu
  - Troubleshooting umum (captcha, session expired, port conflict)
- [ ] **README per service**: `apps/scraper/README.md`, `apps/api/README.md`, `apps/worker/README.md`, `apps/web/README.md`
- [ ] **Diagram arsitektur** di README root (ASCII atau Mermaid)

---

### TASK-510 — Final QA Checklist
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Eksekusi QA manual checklist sebelum project dinyatakan selesai.

**Checklist QA:**

**Flow Scraper:**
- [ ] Scraper berjalan otomatis sesuai interval
- [ ] Produk baru muncul di DB setelah scrape
- [ ] Produk duplikat tidak dibuat ulang
- [ ] Produk dengan harga berubah ter-update

**Flow Posting (Semi-Auto):**
- [ ] Buka dashboard → produk tampil
- [ ] Filter status berfungsi
- [ ] Klik "Post" → status PROCESSING
- [ ] Setelah post → status POSTED
- [ ] Jika gagal → status FAILED

**Flow Posting (Auto Queue):**
- [ ] Batch select 3 produk → klik "Post Semua"
- [ ] Semua masuk queue dengan delay
- [ ] Diproses berurutan, tidak serentak
- [ ] Rate limit berfungsi (max X post/hari)

**Security:**
- [ ] Tidak ada cookie / password di git
- [ ] Session file terenkripsi
- [ ] API tidak accessible dari luar Docker network tanpa port forward

**Reliability:**
- [ ] Restart container API → tetap berfungsi (no corrupted state)
- [ ] Kill worker di tengah posting → job di-retry berikutnya
- [ ] DB down → API return 503 dengan pesan jelas

---

### TASK-511 — Telegram Notification (Opsional V1)
**Estimasi:** 3 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Kirim notifikasi Telegram saat ada event penting.

**Acceptance Criteria:**
- [ ] Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- [ ] Notifikasi dikirim saat:
  - ✅ Produk berhasil diposting
  - ❌ Posting gagal (3x retry habis)
  - ⚠️ Captcha terdeteksi
  - 🔔 Daily limit tercapai
- [ ] Jika env tidak diset → skip (tidak error)
- [ ] Format pesan:
  ```
  ✅ Berhasil Post
  Produk: [Laptop ASUS VivoBook 14]
  Harga: Rp 6.500.000
  Waktu: 16:45 WIB
  ```

---

## ✅ Sprint 5 Definition of Done — Project Complete

### Functional
- [ ] Scraper jalan otomatis setiap interval
- [ ] Produk masuk DB tanpa duplikat
- [ ] Dashboard tampil produk + status
- [ ] Post manual (klik tombol) ✅
- [ ] Post auto (queue + rate limit) ✅
- [ ] Status real-time di dashboard ✅

### Technical
- [ ] `docker-compose up` satu perintah
- [ ] Semua service punya health check
- [ ] Logging terstruktur di semua service
- [ ] Session FB terenkripsi
- [ ] Tidak ada credential di git

### Quality
- [ ] Unit test coverage ≥ 70%
- [ ] Integration test API pass
- [ ] QA checklist TASK-510 hijau semua
- [ ] README cukup untuk orang baru menjalankan project dari nol

---

## 📊 Overview Total Task

| Sprint | Task Count | Total Estimasi |
|--------|-----------|----------------|
| Sprint 0 | 7 tasks | ~18 jam |
| Sprint 1 | 9 tasks | ~36 jam |
| Sprint 2 | 11 tasks | ~37 jam |
| Sprint 3 | 11 tasks | ~53 jam |
| Sprint 4 | 13 tasks | ~54 jam |
| Sprint 5 | 11 tasks | ~41 jam |
| **Total** | **62 tasks** | **~239 jam** |
