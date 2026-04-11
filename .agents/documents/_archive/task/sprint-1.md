# 🕷️ Sprint 1 — Scraper Service (Python)

**Durasi:** 2 minggu  
**Goal:** Scraper bisa berjalan otomatis, ambil produk dari Jakartanotebook, simpan ke DB dengan deduplication.

---

## 🎯 Sprint Goal

> Jalankan `python main.py` → data produk masuk ke tabel `products` di PostgreSQL, tanpa duplikat.

---

## 📋 Task List

### TASK-101 — Setup Python Project
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Inisiasi Python project di `apps/scraper` dengan dependency management dan struktur folder.

**Acceptance Criteria:**
- [ ] Python 3.12 dengan `pyproject.toml` atau `requirements.txt`
- [ ] Dependencies: `playwright`, `psycopg2-binary`, `python-dotenv`, `Pillow`, `apscheduler`, `httpx`, `tenacity`
- [ ] Struktur folder:
  ```
  apps/scraper/
  ├── src/
  │   ├── scraper/        # scraping logic
  │   ├── processor/      # data + image processing
  │   ├── db/             # DB client
  │   └── config.py       # env config
  ├── main.py
  ├── Dockerfile
  └── requirements.txt
  ```
- [ ] `Dockerfile` multi-stage dengan playwright browser install
- [ ] `playwright install chromium` terdokumentasi di Dockerfile

---

### TASK-102 — Konfigurasi & DB Client (Python)
**Estimasi:** 2 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Buat modul koneksi ke PostgreSQL dari Python menggunakan `psycopg2` atau `asyncpg`.

**Acceptance Criteria:**
- [ ] `src/db/client.py` — connection pool ke PostgreSQL
- [ ] `src/config.py` — load env: `DATABASE_URL`, `SCRAPER_INTERVAL_MINUTES`, `PRICE_MARKUP_PERCENT`
- [ ] Fungsi: `upsert_product(product_data: dict) -> None`
- [ ] Gunakan `ON CONFLICT (hash) DO UPDATE` untuk idempotency
- [ ] Connection otomatis retry jika DB belum ready (startup)

**SQL upsert:**
```sql
INSERT INTO "Product" (id, title, price, "imageUrl", description, hash, status, "sourceUrl", "createdAt", "updatedAt")
VALUES (%s, %s, %s, %s, %s, %s, 'DRAFT', %s, NOW(), NOW())
ON CONFLICT (hash) DO UPDATE
SET price = EXCLUDED.price,
    title = EXCLUDED.title,
    "updatedAt" = NOW()
WHERE "Product".status = 'DRAFT';
```

---

### TASK-103 — Scraper: Product Listing Page
**Estimasi:** 6 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Scrape halaman listing produk Jakartanotebook untuk mendapatkan URL produk + data dasar (title, price, thumbnail).

**Acceptance Criteria:**
- [ ] `src/scraper/listing_scraper.py`
- [ ] Scrape kategori laptop/komputer (configurable URL)
- [ ] Ambil: `title`, `price`, `thumbnail_url`, `product_url` dari listing
- [ ] Handle pagination (next page selector)
- [ ] Rate limit: delay random 2-5 detik antar request
- [ ] Retry otomatis hingga 3x jika timeout (gunakan `tenacity`)
- [ ] Return: `List[dict]`

**Catatan implementasi:**
- Gunakan `playwright` dengan `page.goto()` + `page.wait_for_selector()`
- Hindari detect bot: `page.add_init_script()` untuk stealth
- Screenshot on failure untuk debugging

---

### TASK-104 — Scraper: Product Detail Page
**Estimasi:** 5 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Scrape halaman detail produk untuk mendapatkan data lengkap: deskripsi, gambar resolusi penuh, stok.

**Acceptance Criteria:**
- [ ] `src/scraper/detail_scraper.py`
- [ ] Input: `product_url` dari listing
- [ ] Output: `dict` dengan field:
  - `title`: string (normalized, strip whitespace)
  - `price`: int (raw, before markup)
  - `image_urls`: List[str] (ambil semua gambar, max 5)
  - `description`: string
  - `source_url`: string
  - `in_stock`: bool
- [ ] Skip produk dengan `in_stock = False`
- [ ] Handle produk yang halaman detailnya 404

---

### TASK-105 — Data Processor: Price & Normalization
**Estimasi:** 3 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Proses data mentah dari scraper: markup harga, filter keyword, generate hash.

**Acceptance Criteria:**
- [ ] `src/processor/data_processor.py`
- [ ] `apply_markup(price: int, percent: float) -> int` — bulatkan ke ribuan terdekat
- [ ] `generate_hash(title: str, price: int) -> str` — SHA256 dari kombinasi
- [ ] `normalize_title(title: str) -> str` — strip HTML entities, extra whitespace
- [ ] `filter_product(product: dict, config: FilterConfig) -> bool`:
  - filter `min_price`, `max_price`
  - filter keyword blacklist (misal: "bundle", "rusak")
- [ ] Unit test untuk semua fungsi

**Contoh:**
```python
raw_price = 1_250_000
markup_20 = apply_markup(raw_price, 20)  # → 1_500_000
```

---

### TASK-106 — Image Processor: Download + Resize + Watermark
**Estimasi:** 6 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Download gambar produk, resize menjadi 1:1, tambahkan watermark.

**Acceptance Criteria:**
- [ ] `src/processor/image_processor.py`
- [ ] `download_image(url: str, save_path: str) -> bool` — simpan ke `./images/raw/`
- [ ] `resize_square(image_path: str, size: int = 1000) -> Image` — padding putih (bukan crop)
- [ ] `add_watermark(image: Image, config: WatermarkConfig) -> Image`:
  - text watermark: teks configurable, posisi, opacity, font size
  - logo watermark: overlay logo PNG (opsional)
- [ ] `process_product_image(product_id: str, image_url: str) -> str`:
  - download → resize → watermark → simpan ke `./images/processed/{product_id}.jpg`
  - return: local path
- [ ] Jika download gagal: log error, return `None`, produk tetap disimpan tanpa gambar
- [ ] Unit test dengan gambar dummy

**Config:**
```python
@dataclass
class WatermarkConfig:
    text: str = "TokoGue.id"
    position: Literal["bottom-right", "center"] = "bottom-right"
    opacity: float = 0.7
    font_size: int = 40
    logo_path: Optional[str] = None
```

---

### TASK-107 — Scheduler & Main Orchestrator
**Estimasi:** 4 jam  
**Priority:** 🔴 Critical

**Deskripsi:**  
Integrasikan semua komponen: scheduler cron, orchestration scraping, processing, dan simpan ke DB.

**Acceptance Criteria:**
- [ ] `main.py` sebagai entry point
- [ ] `src/scraper/orchestrator.py` — koordinator flow:
  1. Ambil listing → list URL produk
  2. Per URL: scrape detail
  3. Process data (markup, hash, normalize)
  4. Process image (download, resize, watermark)
  5. Upsert ke DB
- [ ] Scheduler dengan `APScheduler` (interval configurable dari env)
- [ ] Logging structured (JSON format) ke stdout
- [ ] Graceful shutdown (SIGTERM handler)
- [ ] Jika satu produk gagal, lanjut ke produk berikutnya (tidak stop semua)

**Flow:**
```python
async def run_scraping_cycle():
    logger.info("Starting scraping cycle")
    listing_urls = await scrape_listing(base_url=config.TARGET_URL)
    for url in listing_urls:
        try:
            detail = await scrape_detail(url)
            processed = process_data(detail)
            processed['image_local'] = await process_image(detail['image_urls'][0])
            await upsert_product(processed)
        except Exception as e:
            logger.error(f"Failed: {url}", exc_info=True)
    logger.info(f"Cycle done. Processed {len(listing_urls)} items")
```

---

### TASK-108 — Anti-Detection & Stealth Config
**Estimasi:** 3 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Implementasi teknik anti-detection agar scraper tidak diblokir.

**Acceptance Criteria:**
- [ ] `src/scraper/stealth.py` — fungsi setup browser context
- [ ] Gunakan `playwright-stealth` atau manual patch:
  - Override `navigator.webdriver`
  - Random User-Agent rotation
  - Random viewport size
- [ ] Delay random antar request (2–5 detik)
- [ ] Retry dengan backoff eksponensial (0.5x, 1x, 2x, 4x)
- [ ] Screenshot on error ke `./logs/screenshots/`

---

### TASK-109 — Scraper Unit Tests
**Estimasi:** 4 jam  
**Priority:** 🟡 High

**Deskripsi:**  
Test untuk semua modul scraper menggunakan data fixture (bukan live scraping).

**Acceptance Criteria:**
- [ ] `tests/test_data_processor.py` — test `apply_markup`, `generate_hash`, `filter_product`
- [ ] `tests/test_image_processor.py` — test dengan gambar dummy
- [ ] `tests/test_db.py` — test upsert dengan mock DB
- [ ] Semua test berjalan dengan `pytest`
- [ ] Coverage ≥ 70%

---

## ✅ Sprint 1 Definition of Done

- [ ] `python main.py` → produk masuk ke DB PostgreSQL
- [ ] Gambar terproses tersimpan di `./images/processed/`
- [ ] Tidak ada duplikat produk di DB (hash unique)
- [ ] Log terstruktur di stdout
- [ ] `pytest` hijau dengan coverage ≥ 70%
- [ ] Docker image scraper bisa build dan run
