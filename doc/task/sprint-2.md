# ⚙️ Sprint 2 — Backend API + Queue System

**Durasi:** 2 minggu  
**Goal:** REST API berfungsi penuh — CRUD produk, trigger posting, dan queue BullMQ siap menerima job.

---

## 🎯 Sprint Goal

> `POST /products/:id/post` → job masuk ke Redis queue dan diproses oleh worker.

---

## 📋 Task List

### TASK-201 — Setup Fastify Application
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Inisiasi Fastify app di `apps/api` dengan TypeScript, plugin standar, dan struktur folder.

**Acceptance Criteria:**
- [ ] Framework: Fastify + TypeScript
- [ ] Dependencies: `fastify`, `@fastify/cors`, `@fastify/helmet`, `zod`, `fastify-zod`
- [ ] Struktur:
  ```
  apps/api/
  ├── src/
  │   ├── routes/
  │   │   ├── products.route.ts
  │   │   └── config.route.ts
  │   ├── services/
  │   │   ├── product.service.ts
  │   │   └── queue.service.ts
  │   ├── schemas/
  │   │   └── product.schema.ts
  │   ├── middleware/
  │   ├── plugins/
  │   └── app.ts
  ├── Dockerfile
  └── package.json
  ```
- [ ] Health check endpoint: `GET /health` → `{ status: "ok", uptime: ... }`
- [ ] CORS enable untuk frontend origin
- [ ] Request/response logging dengan Pino

---

### TASK-202 — Koneksi Prisma dari API
**Estimasi:** 2 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Integrasikan `packages/db` ke `apps/api` sebagai Fastify plugin.

**Acceptance Criteria:**
- [ ] `src/plugins/prisma.plugin.ts` — register Prisma client sebagai Fastify decorator
- [ ] Accessible via `fastify.db` di semua route
- [ ] Graceful disconnect saat server shutdown
- [ ] Connection test saat startup

---

### TASK-203 — Product Routes: GET /products
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Endpoint untuk list dan detail produk dengan filter dan pagination.

**Acceptance Criteria:**
- [ ] `GET /products` — list semua produk
  - Query params: `status`, `page`, `limit`
  - Default: `limit=20`, `page=1`
  - Response: `{ data: Product[], meta: { total, page, limit } }`
- [ ] `GET /products/:id` — detail produk
  - Response: `Product` object
  - Return 404 jika tidak ditemukan
- [ ] Zod schema untuk validasi query params
- [ ] Response serialization dengan `fastify-zod`

**Response Schema:**
```typescript
const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  price: z.number(),
  imageUrl: z.string().nullable(),
  imageLocal: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(['DRAFT', 'PROCESSING', 'POSTED', 'FAILED']),
  postedAt: z.date().nullable(),
  sourceUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

---

### TASK-204 — Redis + BullMQ Setup
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Setup koneksi Redis dan inisiasi BullMQ queue di `apps/api` dan `apps/worker`.

**Acceptance Criteria:**
- [ ] `packages/utils/src/queue.ts` — shared queue definition
- [ ] Queue name: `post_product`
- [ ] Job data type:
  ```typescript
  interface PostJobData {
    productId: string;
    attempt: number;
  }
  ```
- [ ] `src/plugins/redis.plugin.ts` di apps/api — koneksi Redis via IORedis
- [ ] Accessible via `fastify.redis`
- [ ] Queue client di `src/services/queue.service.ts`

---

### TASK-205 — Product Routes: POST /products/:id/post
**Estimasi:** 5 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Endpoint trigger posting ke Facebook Marketplace — validate state, update status, push ke queue.

**Acceptance Criteria:**
- [ ] `POST /products/:id/post`
- [ ] Validasi: produk harus ada dan berstatus `DRAFT` atau `FAILED`
- [ ] Update status → `PROCESSING`
- [ ] Push job ke BullMQ queue: `post_product`
- [ ] Return: `{ jobId: string, message: "Job queued" }`
- [ ] Return 409 jika produk sudah `PROCESSING` atau `POSTED`
- [ ] Return 404 jika produk tidak ada
- [ ] Log job push ke database `Job` table

**Flow:**
```
Request → Validate Product Exists → Check Status → 
Update to PROCESSING → Push Queue → Log to Job table → Return jobId
```

---

### TASK-206 — Config Routes: GET & PATCH /config
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Endpoint untuk membaca dan mengubah konfigurasi runtime (markup, filter, limit post).

**Acceptance Criteria:**
- [ ] `GET /config` — return konfigurasi saat ini
- [ ] `PATCH /config` — update konfigurasi (partial update)
- [ ] Konfigurasi disimpan di file JSON atau environment variable
- [ ] Validasi: `markup_percent` antara 0-200, `max_post_per_day` antara 1-50
- [ ] Perubahan config langsung efektif tanpa restart

**Config shape:**
```typescript
interface AppConfig {
  markupPercent: number;     // default: 25
  minPrice: number;          // default: 0
  maxPrice: number;          // default: 50_000_000
  maxPostPerDay: number;     // default: 8
  blacklistKeywords: string[]; // default: []
  scraperIntervalMinutes: number; // default: 20
}
```

---

### TASK-207 — Batch Post Endpoint
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Endpoint untuk post multiple produk sekaligus dengan delay antar posting.

**Acceptance Criteria:**
- [ ] `POST /products/batch-post`
- [ ] Body: `{ productIds: string[], delaySeconds?: number }`
- [ ] Validasi: max 10 produk sekaligus (sesuai limit/day)
- [ ] Push semua job ke queue dengan delay berurutan (`delaySeconds` antara tiap job)
- [ ] Return: `{ queued: number, jobIds: string[] }`
- [ ] Skip produk yang tidak eligible (tidak DRAFT/FAILED)

---

### TASK-208 — Jobs Log Route
**Estimasi:** 3 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Endpoint untuk melihat history job posting per produk.

**Acceptance Criteria:**
- [ ] `GET /products/:id/jobs` — list semua job untuk produk
- [ ] `GET /jobs` — list semua job terbaru (global)
- [ ] Tampilkan: `status`, `log`, `attempt`, `createdAt`
- [ ] Sortir descending by `createdAt`

---

### TASK-209 — Error Handling & Validation Middleware
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Global error handler dan request validation.

**Acceptance Criteria:**
- [ ] Global error handler di Fastify (setErrorHandler)
- [ ] Format error standar:
  ```json
  {
    "success": false,
    "error": {
      "code": "PRODUCT_NOT_FOUND",
      "message": "Product not found",
      "statusCode": 404
    }
  }
  ```
- [ ] Zod validation error → 422 dengan detail field yang salah
- [ ] Uncaught error → 500 dengan log stack trace (tidak expose ke client)
- [ ] Custom error class: `AppError`, `NotFoundError`, `ConflictError`

---

### TASK-210 — API Integration Tests
**Estimasi:** 4 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Integration test untuk semua endpoint menggunakan `vitest` + Fastify inject.

**Acceptance Criteria:**
- [ ] Setup test dengan Fastify injectnya (tidak butuh actual HTTP server)
- [ ] Mock: Prisma client, BullMQ
- [ ] Test coverage:
  - `GET /health`
  - `GET /products` (empty, with data)
  - `GET /products/:id` (found, not found)
  - `POST /products/:id/post` (success, already posted, not found)
  - `GET /config`, `PATCH /config`
- [ ] Semua test pass

---

### TASK-211 — API Documentation (Swagger/OpenAPI)
**Estimasi:** 2 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Generate dokumentasi API otomatis dari schema Zod.

**Acceptance Criteria:**
- [ ] Plugin `@fastify/swagger` + `@fastify/swagger-ui`
- [ ] Swagger UI tersedia di `GET /docs`
- [ ] Semua endpoint terdokumentasi dengan request/response schema
- [ ] Deploy docs hanya di `NODE_ENV !== 'production'`

---

## ✅ Sprint 2 Definition of Done

- [ ] Semua endpoint merespons sesuai spec
- [ ] `POST /products/:id/post` → job terlihat di Redis queue
- [ ] Error response konsisten dan informatif
- [ ] Integration test pass
- [ ] Swagger docs tersedia di `/docs`
- [ ] Docker image API bisa build dan health-check pass
