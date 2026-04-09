# 🧪 Testing Guide - Panduan Pengujian

Panduan lengkap untuk mencoba semua sistem FB Marketplace Auto Listing Bot.

## 📋 Prerequisites

Sebelum mulai, pastikan Anda sudah memiliki:
- [ ] Docker dan Docker Compose terinstall
- [ ] Git (untuk clone repository)
- [ ] Editor kode (VS Code, dll)
- [ ] Akun Facebook untuk testing

## 🚀 Langkah-Langkah Testing

### 1️⃣ Clone & Setup Repository

```bash
# Clone repository
git clone <repository-url>
cd agentic-scraping

# Copy environment file
cp .env.example .env

# Edit .env dengan editor favorit Anda
nano .env  # atau code .env
```

**Edit `.env`:**
```env
# Database
DATABASE_URL="postgresql://botuser:botpassword@localhost:5432/botdb"

# Redis
REDIS_URL="redis://localhost:6379"

# Facebook Session (PENTING! Generate key baru)
SESSION_ENCRYPT_KEY="your-32-byte-encryption-key-here"
FB_SESSION_PATH="./session/fb_session.json"

# Scraper
TARGET_URL="https://www.jakartanotebook.com/category/laptop"
SCRAPER_INTERVAL_MINUTES=20
PRICE_MARKUP_PERCENT=25
MIN_PRICE=0
MAX_PRICE=50000000
BLACKLIST_KEYWORDS="bundle,rusak,damaged"

# Posting
MAX_POST_PER_DAY=8
POST_DELAY_SECONDS=300

# API
PORT=3001
NODE_ENV="development"

# Dashboard
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Telegram (Opsional)
# TELEGRAM_BOT_TOKEN="your-bot-token"
# TELEGRAM_CHAT_ID="your-chat-id"
```

**Generate encryption key:**
```bash
openssl rand -base64 32
# Copy output ke SESSION_ENCRYPT_KEY
```

---

### 2️⃣ Start Infrastructure (Database & Redis)

```bash
# Start PostgreSQL dan Redis saja
docker-compose up -d postgres redis

# Cek status
docker-compose ps

# Lihat logs jika ada masalah
docker-compose logs postgres
docker-compose logs redis
```

**Expected Output:**
- Container postgres: running
- Container redis: running
- No error logs

**Troubleshooting:**
- Jika port conflict: `lsof -i :5432` dan `lsof -i :6379`
- Jika container tidak start: `docker-compose down && docker-compose up -d`

---

### 3️⃣ Install Dependencies

```bash
# Install root dependencies
npm install

# Install Python dependencies
cd apps/scraper
pip install -r requirements.txt
```

**Expected Output:**
- `added XXX packages in Xs`
- `Successfully installed XXX packages`

**Troubleshooting:**
- Jika npm error: `rm -rf node_modules && npm install`
- Jika pip error: `pip install --upgrade pip` lalu ulang

---

### 4️⃣ Setup Database

```bash
cd packages/db

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

**Expected Output:**
- `Prisma Client generated`
- `The following migration(s) have been applied`
- Tables created: Product, Job

**Troubleshooting:**
- Jika connection failed: Cek DATABASE_URL di .env
- Jika migration conflict: `npx prisma migrate reset`

---

### 5️⃣ Setup Facebook Session (PENTING!)

Hanya perlu dilakukan **satu kali** saat pertama setup.

```bash
cd apps/worker

# Jalankan script setup session
npm run setup:session

# ATAU jalankan langsung
npx tsx scripts/setup-session.ts
```

**Yang akan terjadi:**
1. Browser akan terbuka (headed mode, bukan headless)
2. Browser akan navigasi ke Facebook
3. Anda akan melihat prompt di terminal
4. Login ke Facebook di browser yang terbuka
5. Setelah login, tekan Enter di terminal
6. Session akan disimpan terenkripsi

**Expected Output:**
```
[INFO] Starting Facebook session setup...
[INFO] Navigating to Facebook...
[INFO] ════════════════════════════════════════════════════╗
[INFO] Please login to Facebook in the browser window.
[INFO] After login, press Enter here to save the session...
[INFO] ════════════════════════════════════════════════════╗
[INFO] Session saved successfully!
[INFO] Session path: ./session/fb_session.json
[INFO] Setup complete! You can now start the worker.
```

**Troubleshooting:**
- Jika verification gagal: Refresh halaman Facebook dan ulang
- Jika session tidak tersimpan: Cek SESSION_ENCRYPT_KEY (harus 32 bytes)
- Jika error path: Buat direktori `session/` secara manual: `mkdir -p session`

---

### 6️⃣ Start Semua Services

```bash
# Jalankan semua service sekaligus
docker-compose up -d

# Cek status semua container
docker-compose ps

# Lihat logs semua service
docker-compose logs -f
```

**Expected Output:**
```
[+] Running 6/6
 ✔ fb-bot-postgres    Running
 ✔ fb-bot-redis         Running
 ✔ fb-bot-api           Running
 ✔ fb-bot-worker        Running
 ✔ fb-bot-web           Running
 ✔ fb-bot-scraper       Running
```

**Akses Services:**
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health
- Worker Health: http://localhost:3002/health

---

### 7️⃣ Test Scraper (Manual Mode)

Untuk testing, jalankan scraper satu cycle saja.

```bash
cd apps/scraper

# Jalankan satu cycle scraper
python -m scraper --single-run

# ATAU jalankan tanpa argumen untuk one cycle
python -m scraper
```

**Yang akan terjadi:**
1. Scraper akan membuka website JakartaNotebook
2. Mendeteksi produk laptop
3. Mengambil data produk (title, price, description, image)
4. Mendownload dan memproses gambar
5. Simpan ke database dengan status DRAFT
6. Scraper berhenti setelah selesai

**Expected Output:**
```
[INFO] Starting scraper...
[INFO] Navigating to https://www.jakartanotebook.com/category/laptop
[INFO] Found 15 products on page
[INFO] Processing products...
[INFO] Downloading images...
[INFO] Processing image: laptop-1.jpg
[INFO] Applying watermark...
[INFO] Saving to database: Product 1
[INFO] Saving to database: Product 2
...
[INFO] Completed! Processed 15 products
```

**Verifikasi:**
- Buka dashboard: http://localhost:3000
- Cek apakah produk muncul
- Status harus "DRAFT"

**Troubleshooting:**
- Jika tidak ada produk: Cek TARGET_URL di .env
- Jika error scraping: Cek koneksi internet dan website target
- Jika gambar gagal download: Cek kuota disk dan permission

---

### 8️⃣ Test Dashboard

Buka browser dan navigasi ke: http://localhost:3000

**Halaman yang Tersedia:**
1. **Products** (http://localhost:3000/products) - Daftar semua produk
2. **Settings** (http://localhost:3000/settings) - Konfigurasi bot
3. **Logs** (http://localhost:3000/logs) - Riwayat job posting

**Fitur untuk Di-test:**

**A. Filter & Search:**
- Klik tab "All", "Draft", "Processing", "Posted", "Failed"
- Ketik di search box untuk cari produk
- Klik sort dropdown untuk urutkan (Newest, Price High-Low, dll)

**B. Product Card:**
- Cek gambar produk muncul
- Cek title dan harga tampil dengan format Rupiah
- Cek status badge dengan warna yang benar
- Hover pada kartu untuk melihat checkbox pilihan

**C. Post Produk (Manual):**
- Klik tombol "Post" pada satu produk
- Status harus berubah ke "PROCESSING" (optimistic UI)
- Loading spinner muncul
- Toast notification: "Job berhasil di-queue!"
- Setelah beberapa detik, status berubah ke "POSTED" atau "FAILED"

**D. Batch Post:**
- Hover pada produk dan klik checkbox
- Pilih beberapa produk (maksimal 10)
- Floating action bar akan muncul di bawah
- Klik "Post Semua"
- Produk terpilih masuk queue satu per satu

**E. Product Detail:**
- Klik pada kartu produk untuk membuka drawer
- Cek detail produk ditampilkan lengkap
- Scroll ke bawah untuk lihat riwayat job
- Klik "X" atau tombol ESC untuk menutup drawer

**F. Settings:**
- Buka halaman Settings
- Ubah markup harga
- Ubah price range
- Ubah max post per day
- Ubah blacklist keywords
- Tunggu 1 detik (auto-save)
- Pesan "Tersimpan ✓" muncul

**G. Logs:**
- Buka halaman Logs
- Lihat tabel riwayat job
- Klik row untuk expand dan lihat log detail
- Cek pagination berfungsi

**Expected Output:**
- Dashboard load tanpa error
- Produk tampil dengan data yang benar
- Semua tombol dan fitur berfungsi
- Status update real-time (tanpa refresh halaman)

**Troubleshooting:**
- Jika dashboard tidak load: Cek apakah API berjalan (port 3001)
- Jika produk tidak muncul: Cek database dan API health
- Jika error: Buka browser console untuk melihat error

---

### 9️⃣ Test Auto Posting (End-to-End)

Ini adalah tes **paling penting** - mengalirkan seluruh sistem.

**Langkah:**

1. **Pastikan Scraper sudah berjalan**:
   ```bash
   docker-compose logs -f scraper
   ```
   - Scraper harus mengambil produk secara berkala
   - Produk baru akan muncul di database

2. **Pastikan Worker berjalan**:
   ```bash
   docker-compose logs -f worker
   ```
   - Worker akan mengambil job dari queue
   - Browser harus terbuka (headless di production)

3. **Buka Dashboard dan Post Produk**:
   - Buka http://localhost:3000
   - Klik "Post" pada produk dengan status DRAFT
   - Status berubah ke PROCESSING

4. **Tunggu Worker memproses**:
   - Worker akan ambil job dari queue
   - Browser akan dibuka dan login ke Facebook
   - Produk akan diposting ke Marketplace
   - Status berubah ke POSTED atau FAILED

**Expected Flow:**
```
1. User klik "Post" di Dashboard
2. API menerima request dan buat job di BullMQ
3. Worker mengambil job dari queue
4. Worker buka browser dan login ke Facebook (session dari setup)
5. Worker navigasi ke Marketplace
6. Worker isi form listing
7. Worker submit form
8. Worker update status di database (POSTED/FAILED)
9. Dashboard otomatis update status (polling 5 detik)
10. User lihat produk berubah status di Dashboard
```

**Verifikasi:**
- [ ] Job masuk queue (cek logs API)
- [ ] Worker mengambil job (cek logs worker)
- [ ] Browser buka dan login (cek session)
- [ ] Navigasi ke Marketplace berhasil
- [ ] Form terisi dengan data yang benar
- [ ] Submit berhasil dan listing muncul
- [ ] Status di database berubah POSTED
- [ ] Dashboard update status tanpa refresh

**Expected Logs:**

**API Logs:**
```
[INFO] POST /api/products/:id/post - 201 Created
[INFO] Job created with ID: xxx
```

**Worker Logs:**
```
[INFO] Processing job: xxx
[INFO] Browser initialized
[INFO] Logging in to Facebook...
[INFO] Session loaded successfully
[INFO] Navigating to marketplace...
[INFO] Opening new listing form...
[INFO] Filling listing form...
[INFO] Submitting listing...
[INFO] Listing submitted successfully
[INFO] Status updated to POSTED
```

**Troubleshooting:**
- Jika job tidak diambil: Cek Redis connection
- Jika worker error: Cek logs worker dan screenshot error
- Jika session expired: Jalankan setup session lagi
- Jika captcha: Cek ./screenshots/ dan manual complete

---

### 🔟 10️⃣ Test Health Checks

Test semua health check endpoint untuk memastikan sistem sehat.

```bash
# Test API health (basic)
curl http://localhost:3001/health

# Test API health (detailed)
curl http://localhost:3001/health/detailed

# Test Worker health
curl http://localhost:3002/health

# Test Worker health (detailed)
curl http://localhost:3002/health/detailed
```

**Expected Output:**

**Basic Health:**
```json
{
  "status": "ok"
}
```

**Detailed Health:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok", "latencyMs": 3 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "queue": { "status": "ok", "pendingJobs": 0 }
  },
  "uptime": 3600,
  "version": "1.0.0",
  "timestamp": "2026-04-09T22:00:00.000Z"
}
```

**Troubleshooting:**
- Jika status "error": Cek service yang gagal (postgres/redis)
- Jika latency tinggi (>100ms): Optimize query atau upgrade hardware
- Jika pendingJobs banyak: Worker mungkin lambat, cek logs

---

### 1️⃣1️⃣ Run Security Audit

Jalankan script audit untuk memeriksa masalah keamanan.

```bash
chmod +x scripts/security-audit.sh
./scripts/security-audit.sh
```

**Yang akan dicek:**
- [ ] Tidak ada hardcoded credentials
- [ ] .gitignore mengcover semua sensitive file
- [ ] Session file terenkripsi
- [ ] Tidak ada SQL injection pattern
- [ ] CORS dan rate limiting terkonfigurasi
- [ ] Tidak ada debug endpoint exposed

**Expected Output:**
```
═════════════════════════════════════════════════════════
          SECURITY AUDIT REPORT
═══════════════════════════════════════════════════════════

[INFO] 1. Checking for hardcoded credentials...
[INFO]    ✓ No hardcoded credentials found
[INFO] 2. Checking .gitignore...
[INFO]    ✓ .gitignore is properly configured
...
[INFO] 10. Checking dependencies (npm audit)...
[INFO]    ✓ No vulnerabilities found

═════════════════════════════════════════════════════════
          AUDIT SUMMARY
═══════════════════════════════════════════════════════════

[INFO] ✓ No security issues found!
```

**Jika ada issues:**
- Perbaiki sebelum deploy ke production
- Jangan gunakan hardcoded credentials
- Selalu gunakan environment variables

---

### 1️⃣2️⃣ Run End-to-End Test

Jalankan script E2E test otomatis.

```bash
chmod +x scripts/e2e-test.sh
./scripts/e2e-test.sh
```

**Yang akan dilakukan:**
1. Start Docker services
2. Tunggu service healthy
3. Start API
4. Start Worker
5. Start Scraper (satu cycle)
6. Cek database untuk produk
7. Test semua API endpoints
8. Test Dashboard
9. Generate laporan test

**Expected Output:**
```
═════════════════════════════════════════════════════════
          END-TO-END TEST
═════════════════════════════════════════════════════════

[INFO] === Starting Docker Services ===
[INFO] ✓ Database healthy
[INFO] ✓ Redis healthy
[INFO] === Checking Database for Products ===
[INFO] Found 15 products in database ✓
[INFO] === Starting Dashboard ===
[INFO] ✓ Dashboard started
[INFO] === Testing API Endpoints ===
[INFO] ✓ API /health endpoint
[INFO] ✓ API /products endpoint
[INFO] === Test Results ===
✓ Database healthy
✓ Redis healthy
✓ Products in database
✓ API started
✓ Worker health server started
✓ Scraper completed one cycle
✓ Products in database
✓ API /health endpoint
✓ API /products endpoint
✓ API /stats endpoint
✓ Dashboard started

[INFO] === Summary ===
[INFO] Passed: 10/10
[INFO] All tests passed! ✓
```

**Jika ada test yang gagal:**
- Cek service yang gagal
- Buka logs untuk melihat error
- Perbaiki dan jalankan ulang test

---

## 📊 Monitoring Selama Testing

### Lihat Logs Real-time

```bash
# Semua logs
docker-compose logs -f

# Spesifik service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f scraper
docker-compose logs -f web
```

### Cek Status Container

```bash
# Status semua container
docker-compose ps

# Detail container
docker stats

# Resource usage
docker-compose top
```

### Cek Database

```bash
# Buka Prisma Studio
cd packages/db
npx prisma studio

# ATAU query langsung
docker-compose exec postgres psql -U botuser -d botdb -c "SELECT * FROM \"Product\" ORDER BY createdAt DESC LIMIT 10;"
```

---

## 🐛 Common Issues & Solutions

### Issue: Database Connection Failed

**Symptoms:**
- Error: `Connection refused` atau `authentication failed`
- API log: `Error: connect ECONNREFUSED`

**Solutions:**
```bash
# 1. Pastikan PostgreSQL berjalan
docker-compose ps postgres

# 2. Cek port
lsof -i :5432

# 3. Restart database
docker-compose restart postgres

# 4. Cek DATABASE_URL di .env
cat .env | grep DATABASE_URL
```

---

### Issue: Worker Session Expired

**Symptoms:**
- Worker log: `Session expired`
- Login verification failed

**Solutions:**
```bash
# 1. Jalankan setup session lagi
cd apps/worker
npm run setup:session

# 2. Cek SESSION_ENCRYPT_KEY di .env
cat .env | grep SESSION_ENCRYPT_KEY

# 3. Hapus session file lama
rm -f ./session/fb_session.json
```

---

### Issue: Captcha Detected

**Symptoms:**
- Worker log: `Captcha detected`
- Job pause selama 30 menit
- Screenshot tersimpan di ./screenshots/

**Solutions:**
1. Buka screenshot di `./screenshots/`
2. Login ke Facebook dan selesaikan captcha
3. Worker akan resume otomatis setelah 30 menit
4. Jika masih ada captcha, ulang step 2-3

**Prevention:**
- Jangan post terlalu cepat (ikuti rate limit)
- Gunakan session yang valid
- Jangan gunakan akun baru (akun lama lebih aman)

---

### Issue: Products Not Posting

**Symptoms:**
- Job di queue tapi tidak diproses
- Status tetap PROCESSING lama
- Worker log: error tapi tidak jelas

**Solutions:**
```bash
# 1. Cek queue status
docker-compose exec redis redis-cli LLEN bull:post-product:wait

# 2. Cek worker logs
docker-compose logs worker --tail 100

# 3. Cek browser
docker-compose logs worker | grep "Browser"

# 4. Restart worker
docker-compose restart worker
```

---

### Issue: Dashboard Not Updating

**Symptoms:**
- Status produk tidak update
- Polling tidak berfungsi
- UI tidak realtime

**Solutions:**
```bash
# 1. Cek browser console
# Buka developer tools (F12)
# Cek error di console

# 2. Cek API health
curl http://localhost:3001/health/detailed

# 3. Refresh browser
# Tekan Ctrl+R atau Cmd+R

# 4. Clear cache
# Buka Application tab di developer tools
# Click "Clear site data"
```

---

### Issue: Port Already in Use

**Symptoms:**
- Error: `EADDRINUSE`
- Container tidak start

**Solutions:**
```bash
# 1. Cari proses yang menggunakan port
lsof -i :3000  # Dashboard
lsof -i :3001  # API
lsof -i :3002  # Worker Health
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 2. Kill proses
kill -9 <PID>

# 3. ATAU ubah port di .env
# Ubah PORT, NEXT_PUBLIC_API_URL, dll.
```

---

## 📝 Checklist Testing Lengkap

Sebelum menyatakan sistem "production ready", pastikan:

### Functional Testing
- [ ] Scraper berjalan dan mengambil produk
- [ ] Produk tersimpan di database dengan benar
- [ ] Dashboard menampilkan semua produk
- [ ] Filter dan search berfungsi
- [ ] Tombol "Post" berhasil memposting
- [ ] Batch post berfungsi
- [ ] Status update real-time
- [ ] Settings tersimpan dan efektif
- [ ] Logs muncul dengan benar

### Integration Testing
- [ ] Semua service start tanpa error
- [ ] Health check semua service OK
- [ ] API endpoint berfungsi
- [ ] Worker mengambil job dari queue
- [ ] Database transaction berhasil
- [ ] End-to-end flow (scrape → post) berhasil

### Security Testing
- [ ] Tidak ada hardcoded credentials
- [ ] .gitignore mengcover semua sensitive file
- [ ] Session file terenkripsi
- [ ] Security audit pass
- [ ] Rate limiting berfungsi
- [ ] CORS terkonfigurasi dengan benar

### Performance Testing
- [ ] Scraping ≤ 5s/page
- [ ] Posting ≤ 60s/item
- [ ] API response time ≤ 200ms
- [ ] Dashboard load cepat

### Documentation
- [ ] README lengkap dan akurat
- [ ] Environment variables terdokumentasi
- [ ] Troubleshooting guide lengkap
- [ ] Quick start guide mudah diikuti

---

## 🎉 Selamat Mencoba!

Setelah menyelesaikan semua langkah di atas, Anda seharusnya memiliki sistem yang berjalan penuh dengan:

✅ Scraper yang mengambil produk otomatis
✅ API yang mengelola data dan queue
✅ Worker yang memposting ke Facebook
✅ Dashboard untuk monitoring dan kontrol
✅ Semua service terintegrasi dan termonitor

Jika mengalami masalah, cek section "Common Issues & Solutions" atau lihat logs masing-masing service.

**Selamat mencoba! 🚀**
