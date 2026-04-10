# Test Scenarios: Facebook Posting (Worker)

## 1. Positive Tests
### SC-13: Successful Single Post
- **Pre-condition:** Encrypted session is valid; product image exists.
- **Trigger:** BullMQ job for `productId-1` is processed.
- **Expected Result:** Bot navigates FB, fills form correctly, clicks Publish. Product status in DB becomes `POSTED`.

### SC-14: Session Encryption Roundtrip
- **Pre-condition:** `SESSION_ENCRYPT_KEY` is set in environment.
- **Trigger:** Worker saves session, then restarts and loads it.
- **Expected Result:** Decrypted session matches original; bot remains logged in.

## 2. Negative Tests
### SC-15: Captcha Handling
- **Pre-condition:** Facebook displays a "Security Check" (Captcha).
- **Trigger:** Worker navigates to Marketplace.
- **Expected Result:** Worker detects captcha, pauses processing for 30 minutes, captures screenshot, and logs `FB_CAPTCHA`.

### SC-16: Image File Missing
- **Pre-condition:** `imageLocal` points to a path that does not exist.
- **Trigger:** Job starts processing.
- **Expected Result:** Worker logs error before opening browser; job is failed immediately.

## 3. Edge Cases
### SC-17: Daily Rate Limit
- **Pre-condition:** `MAX_POST_PER_DAY` is set to 5; 5 items already posted today.
- **Trigger:** 6th job enters the queue.
- **Expected Result:** Worker checks Redis counter, sees limit reached, and delays the job to next day.

### SC-18: Dynamic Selector Change
- **Pre-condition:** Facebook changes the ID of the "Publish" button.
- **Trigger:** Worker attempts to click Publish.
- **Expected Result:** Worker fails after timeout, captures screenshot of the new UI, and status becomes `FAILED`.
