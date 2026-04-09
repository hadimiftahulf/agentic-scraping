# 🖥️ Sprint 4 — Frontend Dashboard (Next.js)

**Durasi:** 2 minggu  
**Goal:** Dashboard berfungsi penuh — user bisa melihat produk hasil scraping, filter status, dan trigger posting dengan satu klik.

---

## 🎯 Sprint Goal

> Buka browser → lihat daftar produk → klik "Post" → status berubah real-time tanpa halaman di-refresh.

---

## 📋 Task List

### TASK-401 — Setup Next.js App
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Inisiasi Next.js 14 App Router di `apps/web` dengan TypeScript dan konfigurasi standar.

**Acceptance Criteria:**
- [ ] Next.js 14 dengan App Router
- [ ] Dependencies: `@tanstack/react-query`, `axios`, `zustand`, `date-fns`, `clsx`
- [ ] Struktur:
  ```
  apps/web/
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx
  │   │   ├── page.tsx           # redirect ke /products
  │   │   └── products/
  │   │       └── page.tsx
  │   ├── components/
  │   │   ├── ui/                # atoms (button, badge, card)
  │   │   └── products/          # product-specific
  │   ├── hooks/
  │   ├── lib/
  │   │   ├── api.ts             # axios client
  │   │   └── utils.ts
  │   ├── store/
  │   └── types/
  ├── public/
  └── package.json
  ```
- [ ] `next.config.ts` dengan proxy ke API (rewrite `/api/*` → backend)
- [ ] Environment: `NEXT_PUBLIC_API_URL`

---

### TASK-402 — Design System & Global Styles
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Buat design system: warna, tipografi, komponen UI dasar.

**Acceptance Criteria:**
- [ ] `src/app/globals.css` dengan CSS variables:
  ```css
  :root {
    --bg-primary: #0f1117;
    --bg-card: #1a1d27;
    --bg-surface: #252836;
    --accent: #6c63ff;
    --accent-hover: #5a52e0;
    --text-primary: #f0f0f0;
    --text-secondary: #9ca3af;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
    --border: #2d3148;
    --radius-md: 12px;
    --radius-lg: 16px;
  }
  ```
- [ ] Google Font: **Inter** (100-900)
- [ ] Dark mode by default (tidak perlu toggle)
- [ ] Utility classes: `.card`, `.btn`, `.badge`, `.badge-{status}`
- [ ] Smooth transitions global: `transition: all 0.2s ease`

**Status Badge Colors:**
| Status | Warna |
|--------|-------|
| DRAFT | `#9ca3af` (abu) |
| PROCESSING | `#f59e0b` (kuning, animasi pulse) |
| POSTED | `#10b981` (hijau) |
| FAILED | `#ef4444` (merah) |

---

### TASK-403 — API Client & React Query Setup
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Buat API client dengan Axios dan setup React Query untuk data fetching.

**Acceptance Criteria:**
- [ ] `src/lib/api.ts` — Axios instance dengan baseURL dan interceptors
- [ ] Error interceptor: log dan format error
- [ ] `src/lib/products.api.ts` — fungsi API:
  ```typescript
  getProducts(params: GetProductsParams): Promise<ProductsResponse>
  getProduct(id: string): Promise<Product>
  postProduct(id: string): Promise<{ jobId: string }>
  batchPost(ids: string[]): Promise<BatchPostResponse>
  getConfig(): Promise<AppConfig>
  updateConfig(data: Partial<AppConfig>): Promise<AppConfig>
  ```
- [ ] `src/providers.tsx` — `QueryClientProvider` wrap seluruh app
- [ ] Query keys terdefinisi di `src/lib/query-keys.ts`

---

### TASK-404 — Halaman Products: List View
**Estimasi:** 8 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Halaman utama produk dengan product cards, filter status, dan pagination.

**Acceptance Criteria:**
- [ ] `src/app/products/page.tsx`
- [ ] Layout: header + filter bar + product grid
- [ ] **Filter bar:**
  - Tab: `All | Draft | Processing | Posted | Failed`
  - Search: real-time filter by title (client-side)
  - Sort: newest / price asc / price desc
- [ ] **Product Card** (`src/components/products/ProductCard.tsx`):
  - Gambar produk (atau placeholder jika tidak ada)
  - Title (max 2 baris, ellipsis)
  - Harga (format Rupiah: `Rp 1.250.000`)
  - Status badge
  - Tombol "Post" (disabled jika bukan DRAFT/FAILED)
  - Tombol "View Source" (link ke Jakartanotebook)
  - Relative time: "2 jam lalu"
- [ ] Pagination: `< Prev | 1 2 3 ... | Next >`
- [ ] Loading state: skeleton cards (8 placeholder)
- [ ] Empty state: ilustrasi + teks "Belum ada produk"
- [ ] Error state: tombol retry

---

### TASK-405 — Tombol Post: Optimistic UI
**Estimasi:** 5 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Handle klik "Post" dengan optimistic update — status langsung berubah di UI tanpa tunggu server.

**Acceptance Criteria:**
- [ ] Klik "Post" → optimistic update status jadi `PROCESSING`
- [ ] Tombol berubah jadi loading spinner selama request
- [ ] Jika API sukses: badge update ke `PROCESSING`, toast "Job berhasil di-queue!"
- [ ] Jika API gagal: rollback ke status sebelumnya, toast error
- [ ] `usePostProduct` custom hook dengan React Query mutation
- [ ] Debounce: tidak bisa klik "Post" dua kali dalam 2 detik

---

### TASK-406 — Real-time Status Polling
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Auto-refresh status produk yang sedang `PROCESSING` tanpa halaman reload.

**Acceptance Criteria:**
- [ ] Polling setiap 5 detik untuk produk yang berstatus `PROCESSING`
- [ ] Gunakan React Query `refetchInterval` conditional
- [ ] Stop polling otomatis ketika status berubah ke `POSTED` atau `FAILED`
- [ ] Animasi transisi saat status berubah (badge fade-in)
- [ ] Toast notification: "✅ Produk berhasil diposting!" atau "❌ Posting gagal"

---

### TASK-407 — Product Detail Modal/Drawer
**Estimasi:** 5 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Modal untuk melihat detail produk dan riwayat job.

**Acceptance Criteria:**
- [ ] Klik kartu produk → buka drawer dari kanan
- [ ] Konten drawer:
  - Gambar besar (carousel jika multiple)
  - Detail: title, harga asli, harga markup, source URL
  - Status badge + tanggal post
  - History job (table): attempt, status, log, waktu
- [ ] Close dengan ESC atau klik outside
- [ ] Animasi slide-in dari kanan
- [ ] Mobile: buka sebagai bottom sheet

---

### TASK-408 — Batch Select & Post
**Estimasi:** 5 jam  
**Priority:** 🟡 High

**Deskripsi:**  
User bisa pilih multiple produk dan post sekaligus.

**Acceptance Criteria:**
- [ ] Checkbox di setiap product card (muncul saat hover)
- [ ] "Select All" checkbox di filter bar
- [ ] Floating action bar muncul ketika ada yang dipilih:
  - "X produk dipilih"
  - Tombol "Post Semua" (max 10)
  - Tombol "Deselect All"
- [ ] Konfirmasi dialog sebelum batch post
- [ ] Disable "Post Semua" jika semua yang dipilih bukan DRAFT/FAILED
- [ ] State selection di Zustand store

---

### TASK-409 — Settings Page
**Estimasi:** 4 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Halaman pengaturan bot: markup harga, filter, limit posting harian.

**Acceptance Criteria:**
- [ ] Route: `/settings`
- [ ] Link di sidebar/navbar
- [ ] Form fields:
  - Markup Harga (%): slider + number input
  - Harga Minimum (Rp): number input
  - Harga Maksimum (Rp): number input
  - Max Post Per Hari: number slider (1-20)
  - Blacklist Keywords: tag input (add/remove)
  - Interval Scraping (menit): select (10, 20, 30, 60)
- [ ] Auto-save dengan debounce 1 detik (tidak perlu klik Save)
- [ ] Feedback: "Tersimpan ✓" muncul setelah save

---

### TASK-410 — Dashboard Stats Header
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Stats summary di bagian atas halaman products.

**Acceptance Criteria:**
- [ ] 4 stat cards:
  - Total Produk
  - Draft (siap post)
  - Posted Hari Ini
  - Gagal (perlu perhatian)
- [ ] Animasi counter (angka naik dari 0)
- [ ] Warna sesuai status
- [ ] Refresh otomatis setiap 30 detik

---

### TASK-411 — Sidebar Navigation
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Layout sidebar yang konsisten di semua halaman.

**Acceptance Criteria:**
- [ ] Logo/Brand di atas
- [ ] Menu: Products, Settings, Logs
- [ ] Active state dengan highlight
- [ ] Collapse otomatis di mobile (hamburger menu)
- [ ] Footer sidebar: versi app + status sistem (online/offline dot)

---

### TASK-412 — Logs Page
**Estimasi:** 4 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Halaman riwayat semua job posting.

**Acceptance Criteria:**
- [ ] Route: `/logs`
- [ ] Table dengan kolom: Produk, Status, Attempt, Log Message, Waktu
- [ ] Filter: status, tanggal range
- [ ] Expand row untuk melihat full log message
- [ ] Pagination
- [ ] Export CSV (opsional)

---

### TASK-413 — Responsive & Mobile Polish
**Estimasi:** 3 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Pastikan semua halaman responsif dan usable di mobile.

**Acceptance Criteria:**
- [ ] Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- [ ] Product grid: 1 kolom mobile, 2 tablet, 3-4 desktop
- [ ] Sidebar collapse jadi bottom nav di mobile
- [ ] Touch-friendly: tap target minimal 44x44px
- [ ] Tidak ada horizontal scroll di mobile

---

## ✅ Sprint 4 Definition of Done

- [ ] Dashboard bisa diakses di `http://localhost:3000`
- [ ] Produk dari DB tampil dengan status yang benar
- [ ] Klik "Post" → status berubah di UI
- [ ] Polling status berfungsi (PROCESSING → POSTED tanpa reload)
- [ ] Settings tersimpan dan langsung efektif
- [ ] Responsive di mobile (min. 320px)
- [ ] Build production (`next build`) sukses tanpa error
