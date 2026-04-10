# Identifikasi Masalah: Ekspansi Scraper Multi-Marketplace

**1. Pernyataan Masalah**
Pengguna sistem "FB Marketplace Auto Listing Bot" saat ini terbatas pada satu sumber inventaris (JakartaNotebook), yang membatasi variasi produk dan keunggulan kompetitif mereka di pasar dropshipping. Ketergantungan ini menciptakan titik kegagalan tunggal (single point of failure); jika struktur situs JakartaNotebook berubah, bot kehilangan fungsinya sepenuhnya. Akibatnya, pengguna kehilangan peluang produk untung tinggi dari Shopee, Tokopedia, dan TikTok Shop, yang menyebabkan volume penjualan rendah dan pertumbuhan bisnis yang stagnan.

**2. Pengguna yang Terdampak**
- **Utama: Dropshipper Mandiri**
    - Peran: Pengusaha kecil yang menggunakan bot untuk otomatisasi inventaris.
    - Frekuensi: Harian/Terus-menerus.
    - Mekanisme Saat Ini: Browsing manual di berbagai marketplace, menyalin deskripsi, dan upload manual ke FB Marketplace.
- **Sekunder: Pemilik Agency Digital**
    - Peran: Mengelola banyak akun klien untuk jasa listing.
    - Frekuensi: Batch mingguan.
    - Mekanisme Saat Ini: Mempekerjakan Virtual Assistant (VA) untuk menangani sumber selain JakartaNotebook secara manual.

**3. Titik Masalah (Pain Points)**
- **Risiko Konsentrasi Inventaris**: Pengguna tidak bisa beralih ke produk tren dengan cepat karena terikat pada stok satu supplier.
- **Kelelahan Input Data Manual**: Menambah produk dari marketplace lain butuh 10-15 menit per produk secara manual.
- **Kurangnya Perbandingan Harga**: Tanpa data otomatis multi-sumber, pengguna tidak bisa dengan mudah mencari supplier termurah untuk produk yang sama.

**4. Hipotesis Akar Masalah (5-Why)**
- **Mengapa pengguna terbatas pada JakartaNotebook?** Karena scraper saat ini hanya memiliki implementasi untuk satu struktur DOM spesifik.
- **Mengapa hanya ada satu implementasi?** Karena perangkat asli dibangun sebagai scraper monolitik, bukan berbasis provider.
- **Mengapa dibangun monolitik?** Untuk mencapai MVP tercepat bagi satu kebutuhan pengguna spesifik.
- **Akar Masalah**: Arsitektur sistem saat ini kekurangan lapisan abstraksi untuk "Scraper Providers" dan masih bergantung pada komponen legacy yang tidak terintegrasi secara modular dengan stack utama TypeScript.

**5. Dampak Jika Tidak Diselesaikan**
- **Jangka Pendek (6 bulan)**: Aplikasi akan kehilangan relevansi karena kompetitor meluncurkan bot multi-sumber. Churn rate pengguna akan meningkat.
- **Jangka Panjang (2-3 tahun)**: Proyek menjadi usang secara teknis. Ketidakmampuan menangani proteksi anti-bot marketplace besar akan menghentikan pertumbuhan model bisnis ini.
