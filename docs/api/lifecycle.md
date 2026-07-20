# NextHire AI: API Lifecycle & Governance

This document governs the lifecycle, versioning, and deprecation policies for all public REST APIs and Webhook Events exposed to Enterprise Integrations (LMS/ATS).

## 1. API Versioning

All API routes are version-less in the URL path (e.g., `/api/v1/integrations/*` where `v1` represents the overall Platform integration boundary).

Semantic versioning is handled strictly via HTTP Headers:
- **Canonical Versioning**: `X-NextHire-Version: YYYY-MM-DD`
- **Fallback Versioning**: `Accept: application/vnd.nexthire.v1+json`

### Supported Versions
NextHire AI actively supports the **N-2** most recent API versions. When a new version is released, the oldest supported version enters the deprecation window.

---

## 2. Backward Compatibility Promise

NextHire AI guarantees backward compatibility for all integrations using an active API version. A breaking change will always require a new API version date.

**What is NOT a breaking change (must be handled gracefully by clients):**
- Adding new properties to JSON response payloads.
- Adding new optional query parameters or headers.
- Reordering properties in JSON responses.
- Adding new Webhook event types.

**What IS a breaking change (warrants a new version):**
- Removing or renaming an existing property.
- Changing the data type of an existing property (e.g., `string` to `integer`).
- Making a previously optional parameter mandatory.
- Changing validation rules or error codes.

---

## 3. Deprecation and Sunset Policy

When an API version or specific endpoint is slated for removal, it undergoes a strict Deprecation and Sunset lifecycle to ensure partner stability.

### 1. Deprecation (Minimum 6 Months)
- Notice is published in the Developer Portal and emailed to registered Integration Administrators.
- The `Deprecation` HTTP header is appended to responses (e.g., `Deprecation: @1704067200`).
- The API continues to function identically.

### 2. Sunset Window (Minimum 3 Months)
- The API is marked as deprecated but still functional.
- The `Sunset` HTTP header is appended (RFC 8594) indicating the exact date the API will become unresponsive.
- Temporary "Brownouts" (intentional periodic failures) may be introduced to alert inactive developers.

### 3. End of Life (EOL)
- The endpoint will strictly return HTTP `410 Gone`.

---

## 4. Webhook Event Evolution
Webhook events (e.g. `AssessmentCompleted.v1`) use explicit semantic version tags attached to the event type name to prevent schema drifts.

When an event payload needs breaking changes, a new event type (e.g. `AssessmentCompleted.v2`) is introduced. Old versions follow the standard 6-month deprecation policy.
