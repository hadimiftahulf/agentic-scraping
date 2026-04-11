# Implementation Task List

> Gunakan dokumen ini sebagai backlog utama pengembangan proyek.

---

## Modul: Scraper Service (`scraper`)

**Deskripsi:** Automated extraction of product data from Indonesian marketplaces.

**Dokumentasi:**
- [Overview](../documents/application/modules/scraper/overview.md)
- [API Spec](../documents/application/api/scraper/api-scraper.md)
- [Testing](../documents/application/testing/scraper/test-scraper.md)

| ID Tugas | Platform | Status | Deskripsi | Estimasi | Referensi |
| :------- | :------- | :----- | :-------- | :------- | :-------- |
| SCR-BE-01 | Backend  | Todo   | Setup Playwright with stealth-mode configuration | 2 Jam    | [jakartanotebook-sourcing.md] |
| SCR-BE-02 | Backend  | Todo   | Implement category listing parser using Cheerio/Playwright selectors | 4 Jam    | [jakartanotebook-sourcing.md] |
| SCR-BE-03 | Backend  | Todo   | Implement detail page parser for rich content extraction | 4 Jam    | [jakartanotebook-sourcing.md] |
| SCR-BE-04 | Backend  | Todo   | Implement image processing pipeline (download -> resize -> watermark) | 3 Jam    | [jakartanotebook-sourcing.md] |
| SCR-BE-05 | Backend  | Todo   | Integrate with Prisma for database upserts | 2 Jam    | [jakartanotebook-sourcing.md] |

---
