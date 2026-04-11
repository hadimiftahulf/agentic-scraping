# Spesifikasi API: Scraper Service

> Dokumen ini berisi spesifikasi teknis API untuk layanan pemindaian data (Scraper Service).
> Semua endpoint **WAJIB** mengikuti standar **JSON:API** (https://jsonapi.org).

---

## 1. Standar Global

- **Base URL:** `/api/v1/scraper`
- **Content-Type:** `application/vnd.api+json`
- **Accept:** `application/vnd.api+json`
- **Format Tanggal:** ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)

---

## 2. Endpoints

### 2.1 Trigger Scraper Job

- **URL:** `POST /jobs`
- **Deskripsi:** Memicu pekerjaan pemindaian (scraping) baru untuk marketplace tertentu.
- **Kontrol Akses:** Terautentikasi (Admin/Operator)

#### Request

**Body:**
```json
{
  "data": {
    "type": "scraper-jobs",
    "attributes": {
      "url": "https://www.tokopedia.com/p/laptop",
      "provider": "tokopedia",
      "depth": "listing"
    }
  }
}
```

- `url`: URL target marketplace.
- `provider`: (Opsional) Memaksa penyedia tertentu (`tokopedia`, `shopee`, `jakartanotebook`).
- `depth`: `listing` untuk penemuan produk, `detail` untuk pemindaian produk tunggal.

#### Response

**Sukses (202 Accepted):**
```json
{
  "data": {
    "type": "scraper-jobs",
    "id": "job_123456789",
    "attributes": {
      "status": "queued",
      "createdAt": "2026-04-11T12:00:00Z"
    },
    "links": {
      "self": "/api/v1/scraper/jobs/job_123456789"
    }
  }
}
```

---

### 2.2 Check Job Status

- **URL:** `GET /jobs/:id`
- **Deskripsi:** Memeriksa status dan hasil dari pekerjaan pemindaian.
- **Kontrol Akses:** Terautentikasi

#### Response

**Sukses (200 OK):**
```json
{
  "data": {
    "type": "scraper-jobs",
    "id": "job_123456789",
    "attributes": {
      "status": "completed",
      "processedCount": 24,
      "errorCount": 0,
      "logs": "Scrape completed successfully.",
      "finishedAt": "2026-04-11T12:05:00Z"
    },
    "links": {
      "self": "/api/v1/scraper/jobs/job_123456789"
    }
  }
}
```

---

### 2.3 List Scraper Sources

- **URL:** `GET /sources`
- **Deskripsi:** Mendapatkan daftar marketplace yang didukung dan status aktivasinya.
- **Kontrol Akses:** Terautentikasi

#### Response

**Sukses (200 OK):**
```json
{
  "data": [
    {
      "type": "scraper-sources",
      "id": "jakartanotebook",
      "attributes": {
        "name": "Jakartanotebook",
        "enabled": true,
        "priority": 1,
        "requiresAuth": false,
        "lastScrapeAt": "2026-04-11T00:00:00Z"
      }
    },
    {
      "type": "scraper-sources",
      "id": "shopee",
      "attributes": {
        "name": "Shopee Indonesia",
        "enabled": false,
        "priority": 2,
        "requiresAuth": true,
        "lastScrapeAt": null
      }
    }
  ]
}
```

---

### 2.4 Update Source Configuration

- **URL:** `PATCH /sources/:id`
- **Deskripsi:** Mengubah status aktivasi atau prioritas dari sumber pemindaian.
- **Kontrol Akses:** Peran: Admin

#### Request

**Body:**
```json
{
  "data": {
    "type": "scraper-sources",
    "id": "shopee",
    "attributes": {
      "enabled": true,
      "priority": 1
    }
  }
}
```

#### Response

**Sukses (200 OK):**
```json
{
  "data": {
    "type": "scraper-sources",
    "id": "shopee",
    "attributes": {
      "name": "Shopee Indonesia",
      "enabled": true,
      "priority": 1,
      "requiresAuth": true
    }
  }
}
```

---

## 3. Error Codes

| Status | Code | Title | Detail |
| :--- | :--- | :--- | :--- |
| 422 | `invalid_url` | Invalid URL | URL yang diberikan tidak valid atau tidak didukung oleh provider manapun. |
| 429 | `rate_limit` | Too Many Requests | Batas pemindaian untuk provider ini telah tercapai. |
| 401 | `unauthorized` | Unauthorized | Token otentikasi tidak valid atau sudah kadaluwarsa. |
| 403 | `forbidden` | Forbidden | Anda tidak memiliki akses untuk mengubah konfigurasi sumber. |

---

[Kembali ke Spesifikasi API](../README.md)
