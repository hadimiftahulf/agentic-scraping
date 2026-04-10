# Test Scenarios: Management Dashboard (Web)

## 1. Positive Tests
### SC-19: Product Grid Rendering
- **Pre-condition:** User is logged in; API returns list of products.
- **Trigger:** Navigate to `/products`.
- **Expected Result:** Grid displays product cards with titles, formatted prices (Rp), and status badges. Loading skeletons are shown while fetching.

### SC-20: Optimistic Post Update
- **Pre-condition:** Product card shows status `DRAFT`.
- **Trigger:** Click "Post" button.
- **Expected Result:** Badge immediately changes to `PROCESSING` (pulse) before API response. Toast message "Job successfully queued" appears.

## 2. Negative Tests
### SC-21: API Fetch Failure
- **Pre-condition:** Backend API is down.
- **Trigger:** Refresh `/products` page.
- **Expected Result:** Dashboard shows an error state with a "Retry" button. No empty cards are displayed.

### SC-22: Post Action Forbidden
- **Pre-condition:** Product status is `PROCESSING`.
- **Trigger:** User attempts to click "Post" (simulated via console or UI bug).
- **Expected Result:** Button is disabled in UI. API returns `409 Conflict`, and UI reverts/maintains correct status.

## 3. Edge Cases
### SC-23: Responsive Reflow
- **Pre-condition:** Dashboard is open on a desktop.
- **Trigger:** Resize window to 375px width (Mobile).
- **Expected Result:** Sidebar collapses into a mobile menu/bottom nav. Product grid switches to a single-column layout.

### SC-24: Search No Results
- **Pre-condition:** User searches for a term that matches no products.
- **Trigger:** Type "XYZ-Non-Existent" in search bar.
- **Expected Result:** Empty state illustration appears with text "No products found".
