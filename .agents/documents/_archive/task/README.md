# 📋 Sprint Task Index — FB Marketplace Auto Listing Bot

Proyek ini dibagi menjadi **5 Sprint** dengan total estimasi **~10 minggu**.

---

## 🗺️ Sprint Overview

| Sprint | Tema | Durasi | Tasks | Estimasi | File |
|--------|------|--------|-------|----------|------|
| Sprint 0 | Foundation & Setup | 1 minggu | 7 | ~18 jam | [sprint-0.md](./sprint-0.md) |
| Sprint 1 | Scraper Service (Python) | 2 minggu | 9 | ~36 jam | [sprint-1.md](./sprint-1.md) |
| Sprint 2 | Backend API + Queue System | 2 minggu | 11 | ~37 jam | [sprint-2.md](./sprint-2.md) |
| Sprint 3 | Posting Bot (Worker) | 2 minggu | 11 | ~53 jam | [sprint-3.md](./sprint-3.md) |
| Sprint 4 | Frontend Dashboard (Next.js) | 2 minggu | 13 | ~54 jam | [sprint-4.md](./sprint-4.md) |
| Sprint 5 | Integration, QA & Hardening | 1 minggu | 11 | ~41 jam | [sprint-5.md](./sprint-5.md) |
| **Total** | | **10 minggu** | **62** | **~239 jam** | |

---

## 🏁 Definition of Done (Global)

- [ ] Setiap fitur punya unit test minimal
- [ ] Tidak ada hardcoded credential
- [ ] Docker-compose bisa `up` satu perintah
- [ ] README per service terupdate
- [ ] Status posting terupdate di DB

---

## 📦 Tech Stack Ringkasan

| Layer | Tech |
|-------|------|
| Scraper | Python 3.12 + Playwright + BeautifulSoup |
| Backend API | Node.js + Fastify + Zod |
| Worker | Node.js + BullMQ |
| Database | PostgreSQL + Prisma |
| Queue | Redis |
| Frontend | Next.js 14 (App Router) |
| Infra | Docker Compose |
