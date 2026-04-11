# 🤖 Sprint 3 — Posting Bot (Worker Service)

**Durasi:** 2 minggu  
**Goal:** Worker mengambil job dari queue dan memposting produk ke Facebook Marketplace secara otomatis dengan tingkat keberhasilan ≥ 80%.

---

## 🎯 Sprint Goal

> Job masuk queue → Worker ambil → Playwright buka FB → Produk terposting → Status update ke `POSTED`.

---

## 📋 Task List

### TASK-301 — Setup Worker Application
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Inisiasi `apps/worker` sebagai BullMQ worker service.

**Acceptance Criteria:**
- [ ] Dependencies: `bullmq`, `ioredis`, `playwright`, `@playwright/test`
- [ ] Struktur:
  ```
  apps/worker/
  ├── src/
  │   ├── processors/
  │   │   └── post-product.processor.ts
  │   ├── bot/
  │   │   ├── browser.ts        # browser lifecycle
  │   │   ├── fb-auth.ts        # login & session
  │   │   ├── fb-poster.ts      # posting logic
  │   │   └── stealth.ts        # anti-detection
  │   ├── services/
  │   │   └── product.service.ts
  │   └── worker.ts             # entry point
  ├── Dockerfile
  └── package.json
  ```
- [ ] Entry point `worker.ts` start BullMQ worker
- [ ] Graceful shutdown (drain queue sebelum exit)

---

### TASK-302 — Session Manager: Facebook Login
**Estimasi:** 8 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Implementasi login Facebook dengan session persistence. Ini adalah task paling kritis dan kompleks.

**Acceptance Criteria:**
- [ ] `src/bot/fb-auth.ts`
- [ ] `loginFacebook(page: Page, credentials: Credentials): Promise<boolean>`
  - Buka `facebook.com`
  - Isi email dan password (dengan typing simulation)
  - Handle 2FA checkpoint jika ada (pause + notify)
  - Verifikasi login berhasil (cek URL atau elemen)
- [ ] `saveSession(context: BrowserContext, path: string): Promise<void>`
  - Simpan cookies + localStorage ke JSON
  - Enkripsi file dengan AES (key dari env: `SESSION_ENCRYPT_KEY`)
- [ ] `loadSession(context: BrowserContext, path: string): Promise<boolean>`
  - Decrypt dan load session
  - Verifikasi session masih valid (cek status login)
  - Return `false` jika session expired
- [ ] `ensureLoggedIn(context)`: cek → jika perlu login ulang → login
- [ ] Jangan simpan plaintext password di filesystem
- [ ] Log: session loaded/expired/refreshed

**Strategy:**
```typescript
async function ensureLoggedIn(context: BrowserContext): Promise<Page> {
  const sessionValid = await loadSession(context, config.sessionPath);
  if (!sessionValid) {
    const page = await context.newPage();
    await loginFacebook(page, credentials);
    await saveSession(context, config.sessionPath);
  }
  return context.newPage();
}
```

---

### TASK-303 — Anti-Detection: Browser Stealth
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Setup browser context dengan teknik anti-bot-detection agar tidak diblokir Facebook.

**Acceptance Criteria:**
- [ ] `src/bot/stealth.ts` — `createStealthContext(browser): BrowserContext`
- [ ] Override `navigator.webdriver = false`
- [ ] Simulasikan user-agent browser nyata (Chrome/Windows)
- [ ] Set `Accept-Language`, `plugins`, `platform` yang realistis
- [ ] Disable WebRTC leak
- [ ] Viewport random: 1280-1920 x 720-1080
- [ ] `page.mouse` — jangan langsung click, gerakkan mouse dulu
- [ ] `humanType(page, selector, text)` — ketik dengan delay random antar karakter (50-150ms)
- [ ] `humanScroll(page)` — scroll sebelum aksi
- [ ] Random delay sebelum setiap aksi: 1-3 detik

---

### TASK-304 — FB Marketplace: Navigate & Open Form
**Estimasi:** 6 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Navigasi ke Facebook Marketplace dan buka form "Create New Listing".

**Acceptance Criteria:**
- [ ] `src/bot/fb-poster.ts` — class `FBPoster`
- [ ] `navigateToMarketplace(page)` — buka `facebook.com/marketplace`
- [ ] `openNewListingForm(page)` — klik tombol "Create new listing"
- [ ] `selectCategory(page, category: string)` — pilih kategori "Electronics"
- [ ] Handle popup/dialog yang mungkin muncul (dismiss)
- [ ] Screenshot pada setiap step kritis (untuk debugging)
- [ ] Timeout per aksi: 30 detik (throw jika terlampaui)

**Flow:**
```
/marketplace → klik "Create" → pilih "Item for Sale" → form muncul
```

---

### TASK-305 — FB Marketplace: Fill Form & Upload Image
**Estimasi:** 8 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Isi semua field form listing: judul, harga, deskripsi, upload gambar.

**Acceptance Criteria:**
- [ ] `fillListingForm(page, product: ProductData)`
- [ ] Upload gambar:
  - `input[type=file]` — set files dengan gambar lokal
  - Tunggu preview gambar muncul
- [ ] Isi judul (`title`): max 100 karakter
- [ ] Isi harga (`price`): format angka tanpa separator (FB handle)
- [ ] Isi deskripsi (`description`): max 500 karakter
  - Template deskripsi: `"{title}\n\nHarga: Rp{price}\n\n{description}"`
- [ ] Pilih kondisi: "Used - Good" (default)
- [ ] Pilih lokasi: otomatis detect atau hardcode dari config
- [ ] Verifikasi semua field terisi sebelum submit

---

### TASK-306 — FB Marketplace: Submit & Verify
**Estimasi:** 5 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Submit form listing dan verifikasi bahwa posting berhasil.

**Acceptance Criteria:**
- [ ] `submitListing(page): Promise<PostResult>`
- [ ] Klik tombol "Publish" atau "Next" sampai selesai
- [ ] Tunggu konfirmasi berhasil (URL berubah atau success toast)
- [ ] Ambil listing URL setelah berhasil (opsional)
- [ ] Jika gagal: screenshot, return error detail
- [ ] Return:
  ```typescript
  interface PostResult {
    success: boolean;
    listingUrl?: string;
    error?: string;
    screenshotPath?: string;
  }
  ```

---

### TASK-307 — BullMQ Processor: post_product Job
**Estimasi:** 5 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Implementasi processor BullMQ yang mengkoordinasikan semua langkah posting.

**Acceptance Criteria:**
- [ ] `src/processors/post-product.processor.ts`
- [ ] Ambil data produk dari DB (by `productId`)
- [ ] Pastikan gambar lokal ada (jika tidak, skip/fail)
- [ ] Panggil `FBPoster.post(product)`
- [ ] Update status DB:
  - Sukses → `POSTED`, `postedAt = NOW()`
  - Gagal → `FAILED`
- [ ] Log hasil ke tabel `Job`
- [ ] Jika throw → BullMQ retry otomatis (max 3x)
- [ ] Delay antar retry: eksponensial (30s, 60s, 120s)
- [ ] Setelah 3x gagal → update status `FAILED`, log terakhir disimpan

**Daily Limit:**
- [ ] Cek jumlah post hari ini sebelum eksekusi
- [ ] Jika sudah ≥ `maxPostPerDay` → delay job ke besok pagi

---

### TASK-308 — Worker: Daily Rate Limiter
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Implementasi rate limiter harian untuk tidak melebihi batas posting Facebook.

**Acceptance Criteria:**
- [ ] `src/services/rate-limiter.ts`
- [ ] Simpan counter posting hari ini di Redis (`key: posts:YYYY-MM-DD`)
- [ ] Expire key otomatis: 24 jam
- [ ] `canPostToday(): Promise<boolean>` — cek apakah masih bisa post
- [ ] `incrementPostCount(): Promise<void>` — increment setelah sukses post
- [ ] Jika limit tercapai: job di-reschedule ke jam 8 pagi hari berikutnya
- [ ] Log warning ketika mendekati limit (80%)

---

### TASK-309 — Worker: Browser Lifecycle Management
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Kelola browser instance secara efisien — jangan buka/tutup browser setiap job.

**Acceptance Criteria:**
- [ ] `src/bot/browser.ts` — singleton `BrowserManager`
- [ ] Buka browser satu kali saat worker start
- [ ] Reuse instance untuk job-job berikutnya
- [ ] Tutup browser hanya saat worker shutdown
- [ ] Handle crash: deteksi browser crash dan restart
- [ ] Session validation setiap 2 jam (refresh jika expired)

---

### TASK-310 — Worker: Captcha Detection & Pause
**Estimasi:** 4 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Deteksi captcha atau checkpoint Facebook dan pause bot secara aman.

**Acceptance Criteria:**
- [ ] `detectCaptcha(page: Page): Promise<boolean>`
  - Cek keberadaan elemen captcha atau "security check" di halaman
- [ ] Jika captcha terdeteksi:
  - Screenshot disimpan
  - Job di-pause (tidak di-fail)
  - Notifikasi admin via log (atau webhook Telegram opsional)
  - Worker pause selama 30 menit
  - Setelah pause: cek lagi, jika masih ada → fail job
- [ ] Jangan retry captcha secara agresif (bisa memperburuk ban)

---

### TASK-311 — Worker Tests
**Estimasi:** 5 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Test untuk processor dan services worker (tidak test Playwright secara live).

**Acceptance Criteria:**
- [ ] Mock `FBPoster` untuk test processor
- [ ] Test `rate-limiter.ts` dengan mock Redis
- [ ] Test processor flow: success, fail, retry, daily limit
- [ ] Test session manager: load valid, load invalid, save
- [ ] Semua test pass dengan Vitest

---

## ✅ Sprint 3 Definition of Done

- [ ] Worker ambil job dari queue dan menjalankan posting
- [ ] Status DB terupdate (POSTED / FAILED)
- [ ] Job di-retry otomatis hingga 3x jika gagal
- [ ] Daily rate limit berfungsi
- [ ] Screenshot tersimpan untuk setiap failure
- [ ] Tidak ada password/cookie tersimpan plaintext
- [ ] Test pass
