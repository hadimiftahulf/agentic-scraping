# Prioritas Fitur: Ekspansi Scraper Multi-Marketplace

**1. Tabel Prioritas (MoSCoW)**

| Fitur | Kategori | Rasional |
|---------|----------|-----------|
| **Arsitektur Abstraksi Provider** | Must Have | Fondasi teknis wajib untuk mendukung sumber baru tanpa merusak sistem lama. |
| **Provider Scraper Tokopedia** | Must Have | Target prioritas tinggi karena volume produk dan popularitas di pasar Indo. |
| **Provider Scraper Shopee** | Must Have | Esensial untuk paritas pasar, meskipun tantangan teknis anti-bot sangat tinggi. |
| **Utilitas Lokalisasi Gambar** | Must Have | Gambar harus disimpan lokal sebelum bisa diposting ke FB Marketplace. |
| **Interface Rotasi Proxy** | Must Have | Syarat utama untuk bypass filter rate-limit dan blokir IP marketplace. |
| **Provider Scraper TikTok Shop** | Should Have | Nilai tinggi, namun bisa ditunda beberapa minggu demi stabilitas Tokopedia/Shopee. |
| **Dashboard Pemilihan Provider** | Should Have | Meningkatkan UX signifikan dengan memungkinkan pilihan sumber via UI. |
| **Markup Harga Spesifik Sumber** | Could Have | Memudahkan pengguna menangani selisih pajak/fee antar platform. |
| **Sinkronisasi Stok Real-time** | Could Have | Rumit secara teknis dan beban server tinggi; sync harian cukup untuk awal. |
| **Dukungan Lazada/Blibli** | Won't Have | Prioritas lebih rendah dibanding "Big Three" untuk persona dropshipper saat ini. |

**2. Top 3 Quick Wins**
1. **Utilitas Lokalisasi Gambar**: Usaha rendah (reuse script lama) tapi nilai tinggi karena memastikan semua sumber "Post-Ready".
2. **Dashboard Pemilihan Provider**: Usaha menengah tapi dampak UX tinggi; membuat bot terasa "Multi-Source" seketika.
3. **Provider Scraper Tokopedia**: ROI lebih tinggi dibanding Shopee karena relatif lebih mudah di-scrape dengan volume produk masif.

**3. Item Beban Tinggi & Dampak Rendah**
- **Sinkronisasi Stok Real-time**: Memerlukan scraping konstan (24/7), yang meningkatkan biaya proxy secara signifikan dengan manfaat marjinal dibanding sync harian. **Rekomendasi**: Tunda ke rilis "Enterprise".
- **UI Interaksi Captcha Manual**: Membangun UI khusus untuk interaksi captcha sangat memakan waktu. **Rekomendasi**: Gunakan API solver pihak ketiga sebagai solusi awal.

**4. Ringkasan Prioritas**
Urutan pengerjaan adalah **Arsitektur -> Utilitas -> Tokopedia -> Shopee**. Kami akan melakukan de-coupling sistem scraper menjadi sistem berbasis plugin terlebih dahulu, kemudian mengimplementasikan handler gambar, baru membuktikan model pada Tokopedia sebelum menangani implementasi Shopee yang berisiko teknis lebih tinggi.
