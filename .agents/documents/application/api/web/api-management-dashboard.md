# API Specification: Management Dashboard

> Dokumen ini berisi spesifikasi teknis API untuk Management Dashboard.
> Semua endpoint **WAJIB** mengikuti standar **JSON:API** (https://jsonapi.org).

---

## 1. Standar Global

- **Base URL:** `/api/v1`
- **Content-Type:** `application/vnd.api+json`
- **Accept:** `application/vnd.api+json`
- **Format Tanggal:** ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)

---

## 2. Endpoints

### 2.1 Product List

- **URL:** `GET /products`
- **Deskripsi:** Mengambil daftar produk dengan pagination dan filter.
- **Kontrol Akses:** Terautentikasi

#### Request

**Headers:**

```http
Accept: application/vnd.api+json
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|-------|------|----------|--------|-------|
| page[number] | integer | No | 1 | Nomor halaman |
| page[size] | integer | No | 20 | Item per halaman |
| filter[status] | string | No | - | Filter: DRAFT, PROCESSING, POSTED, FAILED |
| filter[search] | string | No | - | Pencarian di title |

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "total-results": 150,
    "total-pages": 8
  },
  "data": [
    {
      "type": "products",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "attributes": {
        "title": "Laptop ASUS VivoBook 14",
        "price": 1250000,
        "status": "DRAFT",
        "imageUrl": "https://...",
        "createdAt": "2026-04-11T10:00:00Z"
      },
      "links": {
        "self": "/api/v1/products/550e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "links": {
    "self": "/api/v1/products?page[number]=1",
    "next": "/api/v1/products?page[number]=2",
    "last": "/api/v1/products?page[number]=8"
  }
}
```

---

### 2.2 Product Detail

- **URL:** `GET /products/:id`
- **Deskripsi:** Mengambil detail satu produk termasuk riwayat job.
- **Kontrol Akses:** Terautentikasi

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "products",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "attributes": {
      "title": "Laptop ASUS VivoBook 14",
      "price": 1250000,
      "description": "Powerful laptop for productivity",
      "imageUrl": "https://...",
      "status": "DRAFT",
      "createdAt": "2026-04-11T10:00:00Z"
    },
    "relationships": {
      "jobs": {
        "links": {
          "related": "/api/v1/products/550e8400-e29b-41d4-a716-446655440000/jobs"
        }
      }
    },
    "links": {
      "self": "/api/v1/products/550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

---

### 2.3 Trigger Post Job

- **URL:** `POST /products/:id/post`
- **Deskripsi:** Memicu job posting untuk produk tertentu.
- **Kontrol Akses:** Terautentikasi

#### Response

**Success (202 Accepted):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "message": "Posting job has been queued.",
    "jobId": "770e8400-e29b-41d4-a716-446655449999"
  }
}
```

---

### 2.4 Job List

- **URL:** `GET /jobs`
- **Deskripsi:** Mengambil daftar job dengan filter status.
- **Kontrol Akses:** Terautentikasi

#### Request

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|-------|------|----------|--------|-------|
| page[number] | integer | No | 1 | Nomor halaman |
| page[size] | integer | No | 20 | Item per halaman |
| filter[status] | string | No | - | Filter: waiting, active, completed, failed |

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "total-results": 50,
    "total-pages": 3
  },
  "data": [
    {
      "type": "jobs",
      "id": "770e8400-e29b-41d4-a716-446655449999",
      "attributes": {
        "status": "completed",
        "attempt": 1,
        "createdAt": "2026-04-11T10:00:00Z",
        "completedAt": "2026-04-11T10:01:00Z"
      },
      "relationships": {
        "product": {
          "data": {
            "type": "products",
            "id": "550e8400-e29b-41d4-a716-446655440000"
          }
        }
      }
    }
  ]
}
```

---

### 2.5 Job Detail

- **URL:** `GET /jobs/:id`
- **Deskripsi:** Mengambil detail job termasuk log.
- **Kontrol Akses:** Terautentikasi

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "jobs",
    "id": "770e8400-e29b-41d4-a716-446655449999",
    "attributes": {
      "status": "failed",
      "attempt": 3,
      "log": "Facebook session expired. Please re-authenticate.",
      "screenshotPath": "/logs/screenshots/job-fail.png",
      "createdAt": "2026-04-11T10:00:00Z",
      "failedAt": "2026-04-11T10:02:00Z"
    },
    "relationships": {
      "product": {
        "data": {
          "type": "products",
          "id": "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    }
  }
}
```

---

### 2.6 Health Check

- **URL:** `GET /health`
- **Deskripsi:** Memeriksa kesehatan sistem (DB + Redis).
- **Kontrol Akses:** Publik

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "meta": {
    "timestamp": "2026-04-11T10:00:00Z"
  },
  "data": {
    "type": "health",
    "id": "system",
    "attributes": {
      "status": "healthy",
      "services": {
        "database": "connected",
        "redis": "connected"
      }
    }
  }
}
```

---

### 2.7 Readiness Probe

- **URL:** `GET /health/readiness`
- **Deskripsi:** Readiness probe untuk container orchestration.
- **Kontrol Akses:** Publik

#### Response

**Success (200 OK):**

```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "health",
    "id": "readiness",
    "attributes": {
      "ready": true,
      "checks": {
        "database": true,
        "redis": true
      }
    }
  }
}
```

---

## 3. Error Dictionary

| HTTP Code | Error Code         | Detail                                                              |
| --------- | ------------------ | ------------------------------------------------------------------- |
| 400       | INVALID_PAGINATION | Parameter page harus >= 1                                           |
| 404       | NOT_FOUND          | Produk tidak ditemukan                                              |
| 409       | INVALID_STATE      | Produk tidak eligible untuk di-post (status PROCESSING atau POSTED) |
| 422       | VALIDATION_ERROR   | Parameter tidak valid                                               |

**Example Error Response:**

```json
{
  "jsonapi": { "version": "1.1" },
  "errors": [
    {
      "status": "409",
      "code": "INVALID_STATE",
      "title": "Conflict",
      "detail": "Product cannot be posted because its current status is PROCESSING.",
      "source": { "pointer": "/data/attributes/status" }
    }
  ]
}
```

---

## 4. Validation Rules

| Field          | Type    | Rules                                   |
| -------------- | ------- | --------------------------------------- |
| page[number]   | integer | min: 1                                  |
| page[size]     | integer | min: 1, max: 100                        |
| filter[status] | string  | enum: DRAFT, PROCESSING, POSTED, FAILED |
| filter[search] | string  | minLength: 3                            |
