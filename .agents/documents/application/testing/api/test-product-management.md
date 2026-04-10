# Test Scenarios: Product Management (API)

## 1. Positive Tests
### SC-07: Fetch Product List
- **Pre-condition:** Database has at least 5 products.
- **Trigger:** `GET /api/products?page[size]=2`
- **Expected Result:** Status 200, returns first 2 products in JSON:API format with correct pagination links (`next`, `last`).

### SC-08: Trigger Posting Job
- **Pre-condition:** Product `ID-123` has status `DRAFT`.
- **Trigger:** `POST /api/products/ID-123/post`
- **Expected Result:** Status 202, returns `jobId`. Database status for `ID-123` updates to `PROCESSING`.

## 2. Negative Tests
### SC-09: Product Not Found
- **Pre-condition:** Product `NON-EXISTENT-ID` does not exist.
- **Trigger:** `GET /api/products/NON-EXISTENT-ID`
- **Expected Result:** Status 404, returns JSON:API error with code `NOT_FOUND`.

### SC-10: Duplicate Posting Request
- **Pre-condition:** Product `ID-456` has status `PROCESSING`.
- **Trigger:** `POST /api/products/ID-456/post`
- **Expected Result:** Status 409, returns JSON:API error with code `INVALID_STATE`.

## 3. Edge Cases
### SC-11: Empty Database
- **Pre-condition:** Database is empty.
- **Trigger:** `GET /api/products`
- **Expected Result:** Status 200, `data` is an empty array `[]`.

### SC-12: Invalid Status Filter
- **Pre-condition:** N/A.
- **Trigger:** `GET /api/products?filter[status]=UNKNOWN`
- **Expected Result:** Status 422, returns JSON:API error with code `VALIDATION_ERROR`.
