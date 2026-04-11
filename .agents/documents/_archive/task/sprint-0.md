# 🚀 Sprint 0 — Foundation & Monorepo Setup

**Durasi:** 1 minggu  
**Goal:** Seluruh skeleton project berjalan, Docker bisa dijalankan, tim bisa mulai dev secara paralel.

---

## 🎯 Sprint Goal

> Satu perintah `docker-compose up` → semua service berjalan (meski belum ada fitur).

---

## 📋 Task List

### TASK-001 — Inisiasi Monorepo
**Estimasi:** 4 jam  
**Assignee:** Lead Dev  
**Priority:** 🔴 Critical

**Deskripsi:**  
Setup struktur folder monorepo sesuai system-design.md.

**Acceptance Criteria:**
- [ ] Folder `apps/scraper`, `apps/api`, `apps/worker`, `apps/web` terbuat
- [ ] Folder `packages/db`, `packages/utils`, `packages/config` terbuat
- [ ] Folder `infra/docker`, `infra/redis` terbuat
- [ ] `.gitignore` root dengan entry: `node_modules/`, `.env`, `*.pyc`, `__pycache__/`, `session/`
- [ ] `README.md` root berisi deskripsi singkat dan cara menjalankan

**Sub-tasks:**
```bash
mkdir -p apps/{scraper,api,worker,web}
mkdir -p packages/{db,utils,config}
mkdir -p infra/{docker,redis}
```

---

### TASK-002 — Inisiasi Node.js Workspace
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Setup npm workspaces di root untuk `apps/api`, `apps/worker`, `apps/web`, dan `packages/*`.

**Acceptance Criteria:**
- [ ] `package.json` root dengan `"workspaces": ["apps/*", "packages/*"]`
- [ ] Masing-masing workspace punya `package.json` sendiri
- [ ] `npm install` dari root bisa resolve semua workspace
- [ ] TypeScript config (`tsconfig.base.json`) dibuat di root

**File yang dibuat:**
```
package.json (root)
tsconfig.base.json
apps/api/package.json
apps/worker/package.json
apps/web/package.json
packages/db/package.json
packages/utils/package.json
packages/config/package.json
```

---

### TASK-003 — Prisma Schema & Database Setup
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Buat schema Prisma berdasarkan data model di SRS (table `products` dan `jobs`).

**Acceptance Criteria:**
- [ ] `packages/db/prisma/schema.prisma` terdefinisi dengan model `Product` dan `Job`
- [ ] Enum `Status`: `DRAFT | POSTED | FAILED | PROCESSING`
- [ ] Field `hash` wajib `@unique` (deduplication)
- [ ] `packages/db/src/index.ts` export `PrismaClient`
- [ ] Migration awal bisa dijalankan: `npx prisma migrate dev --name init`

**Schema:**
```prisma
model Product {
  id          String   @id @default(uuid())
  title       String
  price       Int
  imageUrl    String?
  imageLocal  String?
  description String?
  hash        String   @unique
  status      Status   @default(DRAFT)
  postedAt    DateTime?
  sourceUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  jobs        Job[]
}

model Job {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  status    String
  log       String?
  attempt   Int      @default(0)
  createdAt DateTime @default(now())
}

enum Status {
  DRAFT
  PROCESSING
  POSTED
  FAILED
}
```

---

### TASK-004 — Docker Compose Setup
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Buat `docker-compose.yml` yang merunning semua service + PostgreSQL + Redis.

**Acceptance Criteria:**
- [ ] Service: `postgres`, `redis`, `api`, `worker`, `scraper`, `web`
- [ ] `postgres` pakai volume persistent
- [ ] `redis` pakai volume persistent
- [ ] Health check untuk `postgres` dan `redis`
- [ ] Network `bot-network` terdefinisi
- [ ] `docker-compose up -d` semua service jalan (meski app masih placeholder)

**File:** `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck: ...
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    healthcheck: ...

  scraper:
    build: ./apps/scraper
    depends_on: [postgres]
    environment:
      - DATABASE_URL

  api:
    build: ./apps/api
    depends_on: [postgres, redis]
    ports: ["3001:3001"]

  worker:
    build: ./apps/worker
    depends_on: [redis, postgres]

  web:
    build: ./apps/web
    depends_on: [api]
    ports: ["3000:3000"]
```

---

### TASK-005 — Environment Config Setup
**Estimasi:** 2 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Setup env management. Tidak ada hardcoded credential.

**Acceptance Criteria:**
- [ ] `.env.example` di root dengan semua key yang dibutuhkan
- [ ] `packages/config/src/index.ts` parse dan export env dengan Zod validation
- [ ] Script `cp .env.example .env` terdokumentasi di README

**`.env.example`:**
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/botdb

# Redis
REDIS_URL=redis://redis:6379

# Facebook Session
FB_SESSION_PATH=./session/fb_session.json

# App Config
SCRAPER_INTERVAL_MINUTES=20
PRICE_MARKUP_PERCENT=25
MAX_POST_PER_DAY=8
PORT=3001
```

---

### TASK-006 — CI/CD Pipeline (GitHub Actions)
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Setup GitHub Actions untuk lint + typecheck pada setiap PR.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` berjalan pada `push` dan `pull_request`
- [ ] Job: `lint`, `typecheck`, `test`
- [ ] Cache `node_modules` dan Python packages
- [ ] Wajib hijau sebelum merge

---

### TASK-007 — Shared Utils Package
**Estimasi:** 2 jam  
**Priority:** 🟢 Medium

**Deskripsi:**  
Buat `packages/utils` dengan helper yang dipakai lintas service.

**Acceptance Criteria:**
- [ ] `generateHash(title: string, price: number): string` (MD5/SHA256)
- [ ] `sleep(ms: number): Promise<void>`
- [ ] `randomDelay(min: number, max: number): Promise<void>`
- [ ] `formatPrice(price: number): string` (IDR format)
- [ ] Unit tests untuk semua fungsi

---

## ✅ Sprint 0 Definition of Done

- [ ] `docker-compose up -d` semua container running
- [ ] `npx prisma migrate dev` sukses
- [ ] Semua placeholder service return 200/health
- [ ] `.env.example` lengkap dan terdokumentasi
