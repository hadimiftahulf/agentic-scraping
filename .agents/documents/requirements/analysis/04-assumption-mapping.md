# Pemetaan Asumsi: Ekspansi Scraper Multi-Marketplace

**1. Asumsi Pengguna**
- **Asumsi**: Pengguna bersedia membayar lebih atau berlangganan lebih lama jika mereka bisa scrape dari Shopee/Tokopedia/TikTok Shop.
    - Tingkat Risiko: Tinggi
    - Eksperimen Validasi: Lakukan "smoke test" atau survei pada pengguna saat ini mengenai minat fitur premium multi-source.
- **Asumsi**: Pengguna memiliki kemampuan untuk membuat akun di marketplace tersebut jika diperlukan untuk scraping.
    - Tingkat Risiko: Sedang
    - Eksperimen Validasi: Cek data onboarding atau diskusi forum untuk melihat apakah blokir akun adalah masalah umum.

**2. Asumsi Pasar**
- **Asumsi**: FB Marketplace di Indonesia tetap menjadi saluran penjualan volume tinggi untuk dropship.
    - Tingkat Risiko: Tinggi
    - Eksperimen Validasi: Analisis data "Recently Sold" di FB Marketplace untuk SKU dropship umum.
- **Asumsi**: Belum ada alat kompetitor gratis yang sempurna menangani semua marketplace Indonesia ini.
    - Tingkat Risiko: Sedang
    - Eksperimen Validasi: Riset di GitHub dan grup Telegram untuk menemukan alternatif software sejenis.

**3. Asumsi Teknis**
- **Asumsi**: Proteksi anti-bot Shopee dan Tokopedia (Cloudflare, dll) dapat dilewati secara konsisten dengan teknik stealth browser.
    - Tingkat Risiko: Tinggi
    - Eksperimen Validasi: Jalankan skrip "Scraper POC" menargetkan Shopee 50 kali dalam 24 jam untuk cek block rate.
- **Asumsi**: Struktur TikTok Shop yang video-heavy dapat di-scrape metadatanya secara andal.
    - Tingkat Risiko: Tinggi
    - Eksperimen Validasi: Prototype scraper TikTok Shop untuk memverifikasi ketersediaan metadata di JSON/HTML awal.

**4. Asumsi Model Bisnis**
- **Asumsi**: Kami dapat menjaga scraper tetap berjalan meskipun ada perubahan DOM tanpa butuh engineer full-time per marketplace.
    - Tingkat Risiko: Sedang
    - Eksperimen Validasi: Pantau perubahan DOM Shopee/Tokopedia selama 2 minggu.
- **Asumsi**: Biaya proxies berkualitas tinggi dapat ditutup oleh biaya langganan pengguna.
    - Tingkat Risiko: Sedang
    - Eksperimen Validasi: Hitung "Cost per 1,000 Scrapes" menggunakan penyedia proxy dan bandingkan dengan revenue.

**5. Matriks Prioritas Asumsi (Top 3)**
| Prioritas | Asumsi | Kategori | Risiko | Validasi |
|----------|-----------|----------|------|-------------------|
| 1 | Bypass anti-bot Shopee/Tokopedia | Teknis | Tinggi | Scraper POC Script (24j) |
| 2 | Minat bayar pengguna untuk multi-source | Pengguna | Tinggi | Smoke Test / Survei |
| 3 | Keandalan metadata TikTok Shop | Teknis | Tinggi | Prototype Detail Scraper |
| 4 | Stabilitas ROI FB Marketplace | Pasar | Tinggi | Riset Pasar Sekunder |
