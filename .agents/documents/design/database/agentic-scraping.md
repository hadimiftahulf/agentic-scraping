# Database Schema Plan: FB Marketplace Auto Listing Bot

## 1. Tables & ERD

### Table: Product
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier. |
| title | TEXT | NOT NULL | Product title from source. |
| price | INT | NOT NULL | Final price after markup. |
| imageUrl | TEXT | NULLABLE | URL of source image. |
| imageLocal | TEXT | NULLABLE | Local path to processed image. |
| description | TEXT | NULLABLE | Product description. |
| hash | TEXT | UNIQUE, NOT NULL | Fingerprint for deduplication. |
| status | TEXT | NOT NULL, DEFAULT 'DRAFT' | DRAFT, PROCESSING, POSTED, FAILED. |
| sourceUrl | TEXT | NULLABLE | Original product link. |
| postedAt | TIMESTAMP | NULLABLE | Time when successfully posted. |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time. |
| updatedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record update time. |

### Table: Job
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Job identifier. |
| productId | UUID | FOREIGN KEY REFERENCES Product(id) | Target product. |
| status | TEXT | NOT NULL | Queue status (pending, completed, failed). |
| log | TEXT | NULLABLE | Error or execution details. |
| attempt | INT | NOT NULL, DEFAULT 0 | Retry attempt number. |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Job creation time. |

## 2. Indexes
- `idx_product_hash`: Unique index on `Product(hash)`.
- `idx_product_status`: Index on `Product(status)` for dashboard filtering.
- `idx_job_product_id`: Index on `Job(productId)` for history retrieval.

## 3. Relationships
- **Product** (1) <--- (N) **Job**: One product can have multiple posting attempts/jobs.
