# Cakupan MVP: Ekspansi Scraper Multi-Marketplace

**1. Tabel Fitur MoSCoW**

| Fitur | Kategori | Rasional | Estimasi Usaha |
|---------|----------|-----------|-----------------|
| **Abstraksi Scraper Provider** | Must Have | Fondasi untuk semua logika multi-source. Tanpa ini, sistem tidak modular. | L |
| **Scraper Produk Tokopedia** | Must Have | Target prioritas pertama dengan volume dan nilai pasar tinggi. | M |
| **Scraper Produk Shopee** | Must Have | Esensial untuk paritas pasar, meski tantangan anti-bot tinggi. | L |
| **Lokalisasi Gambar** | Must Have | Wajib untuk posting FB Marketplace (gambar harus dari path lokal). | S |
| **Dukungan Proxy Rotation** | Must Have | Esensial untuk menghindari blokir IP dari marketplace. | M |
| **Scraper Produk TikTok Shop** | Should Have | Nilai tinggi tapi lebih berisiko secara teknis. | L |
| **Dashboard Pemilihan Provider** | Should Have | Meningkatkan UX tapi fungsi inti bisa jalan tanpa UI ini di awal. | M |
| **Markup Harga per Sumber** | Could Have | Fitur bagus tapi markup global sudah cukup untuk MVP. | S |
| **Sinkronisasi Stok Real-time** | Could Have | Kompleks dan beban server tinggi; sync batch sudah cukup. | XL |
| **Dukungan Lazada / Blibli** | Won't Have | Di luar cakupan MVP untuk menjaga fokus tim. | L |

**2. Pernyataan Definisi MVP**
MVP ini akan menghadirkan orkestrator scraper modular yang mendukung ekstraksi produk otomatis dari **Tokopedia** dan **Shopee**. Fokus utamanya adalah memungkinkan "Provider-based" scraping di mana pengguna dapat memilih marketplace sumber dan bot menangani persyaratan DOM serta anti-bot unik dari sumber tersebut. MVP ini TIDAK mencakup rombakan Posting Worker (Node.js) di tahap awal.

**3. Metrik Keberhasilan**
- **Metrik: Scraping Success Rate** | Target: >85% untuk Tokopedia/Shopee | Metode: Analisis log kode sukses 200/500.
- **Metrik: Waktu Listing (Sumber Baru)** | Target: < 5 menit untuk 10 produk | Metode: Timer dari awal scrape sampai DB upsert.
- **Metrik: Adopsi Pengguna** | Target: 50% pengguna aktif mencoba impor dari sumber selain JakartaNotebook | Metode: Query SQL pada tabel Product field `source_url`.

**4. Bendera Risiko Cakupan (Scope Risks)**
- **Kelebihan Beban Must Have**: Jika bypass anti-bot Shopee memakan waktu >1 minggu, risiko menunda seluruh MVP. **Mitigasi**: Luncurkan dengan Tokopedia saja sebagai versi "Beta" jika Shopee terhambat.
- **Maintenance Creep**: Menambah dua marketplace besar menggandakan risiko kerusakan DOM secara bersamaan. **Mitigasi**: Pusatkan logika selektor ke file konfigurasi yang ringan dan mudah diupdate.
