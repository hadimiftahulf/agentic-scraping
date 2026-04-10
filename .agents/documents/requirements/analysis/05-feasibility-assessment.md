# Penilaian Kelayakan: Ekspansi Scraper Multi-Marketplace

**1. Kelayakan Teknis (Skor: 8/10)**
Pengalihan penuh ke stack JS/TS + Playwright akan meningkatkan konsistensi kode dengan modul Worker dan API yang sudah ada. Menggunakan satu bahasa (TypeScript) di seluruh ekosistem akan mempermudah maintenance dan berbagi utilitas (seperti logging pino dan enkripsi session). Proteksi anti-bot di Shopee/Tokopedia tetap menjadi tantangan, namun ekosistem Node.js memiliki dukungan plugin stealth Playwright yang sangat matang.

**Risiko**:
- **Evolusi Anti-Bot**: Marketplace mengupdate deteksi bot lebih cepat dari patch stealth open-source.
- **Konsistensi Data**: TikTok Shop mungkin memiliki tingkat kegagalan ekstraksi metadata yang tinggi.
- **Beban Pemeliharaan**: Mengelola struktur DOM untuk 4+ marketplace dengan tim kecil.

**2. Kelayakan Finansial**
| Item | Dasar Biaya | Biaya Peluncuran | Biaya 1.000 Pengguna |
|------|------------|-------------|----------------------------|
| Pengembangan | ~80 jam dev | Rp 0 (Internal) | Rp 0 |
| Layanan Proxy | Residential / Mobile | Rp 1jt - 1.5jt/bln | Rp 7jt - 15jt/bln |
| Captcha Solving | Per 1k solves | Rp 150rb/bln | Rp 1.5jt/bln |
| Infrastruktur | Docker / DB | Rp 300rb/bln | Rp 1.5jt/bln |
| **Total Estimasi** | | **~Rp 1.5jt - 2jt/bln** | **~Rp 10jt - 18jt/bln** |

**Verdict: Ketat**. Biaya operasional proxy berkualitas cukup tinggi dan harus ditanggung oleh model harga langganan yang berkelanjutan.

**3. Kelayakan Waktu**
- **Fitur MVP**: Scraper Tokopedia + Shopee.
- **Estimasi Timeline**: 4 minggu (1 mgg refaktor arsitektur + 1 mgg per marketplace + 1 mgg QA).
- **Risiko Overrun**: Tinggi, karena kendala teknis tak terduga di Cloudflare Shopee.

**Verdict: Berisiko**. Pemblokiran teknis pada satu marketplace bisa menggandakan waktu pengembangan untuk modul tersebut.

**4. Matriks Risiko**
| Risiko | Dimensi | Kemungkinan | Dampak | Mitigasi |
|------|-----------|------------|--------|------------|
| Blokir IP permanen dari Shopee | Teknis | Tinggi | Tinggi | Gunakan residential rotating proxies yang berkualitas. |
| Perubahan Struktur DOM | Bisnis | Tinggi | Sedang | Implementasikan health-checks otomatis untuk selektor. |
| Obfuskasi Metadata TikTok Shop | Teknis | Sedang | Tinggi | Gunakan teknik mobile-app scraping atau reverse-engineer API privat. |

**5. Rekomendasi Go/No-Go**
**Go with Conditions**:
1. **Arsitektur Dulu**: Harus mengimplementasikan abstraksi "Scraper Provider" sebelum menambah logika spesifik marketplace.
2. **Anggaran Proxy**: Menyiapkan anggaran untuk biaya operasional residential proxies.
3. **Peluncuran Bertahap**: Implementasikan satu marketplace baru (misal: Tokopedia) secara penuh sebelum memulai yang berikutnya.
