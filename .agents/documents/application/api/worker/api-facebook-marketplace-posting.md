# Internal Interface: Facebook Posting (JSON:API)

## 1. Job Result Data

This structure is used for internal logging and updating the `Job` entity.

```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "jobs",
    "id": "770e8400-e29b-41d4-a716-446655449999",
    "attributes": {
      "status": "completed",
      "attempt": 1,
      "log": "Successfully posted to FB Marketplace.",
      "screenshotPath": "/logs/screenshots/job-9999.png",
      "listingUrl": "https://facebook.com/marketplace/item/123456789/"
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

## 2. Validation Rules (Posting Parameters)

| Field       | Type    | Required | Constraint             |
| ----------- | ------- | -------- | ---------------------- |
| title       | string  | Yes      | Max 100 characters     |
| price       | integer | Yes      | No currency separators |
| description | string  | Yes      | Max 500 characters     |
| imagePath   | string  | Yes      | Must exist on disk     |

## 3. Error Dictionary

| Code         | Message           | Description                                         |
| ------------ | ----------------- | --------------------------------------------------- |
| FB_AUTH_FAIL | Session Expired   | The saved session is no longer valid.               |
| FB_CAPTCHA   | Security Check    | Facebook triggered a captcha or 2FA challenge.      |
| FB_FORM_ERR  | Field Invalid     | A specific field (e.g. price) was rejected by FB.   |
| FB_POST_FAIL | Submission Failed | The Publish button did not lead to a success state. |
