# STU-AFFAIRS-P1-006-41 — Student Documents Metadata UI Parity

## Mission

Implement the approved metadata-only UI parity fix for the active Student Documents portal. The change is limited to truthful canonical response handling and explicit metadata lifecycle states.

## Root Cause

The portal did not expose a retry action for server failures, the detail request had no visible loading state, and an HTTP 200 response containing `success: false` could be treated as a successful request by the client.

## Implementation

- Reject canonical API responses that explicitly return `success: false`, including HTTP 200 responses.
- Add a visible metadata retry action for server errors.
- Add a visible canonical detail-loading state.
- Preserve existing trusted authorization, tenant context, metadata-only API usage, and lifecycle controls.
- Add focused regression coverage for retry behavior and false-success prevention.

## Explicit Non-Scope

No database, migration, RLS, authorization, tenant, API, Storage bucket, binary upload/download/preview, OCR, scanning, or server changes were introduced.

## Files

- `src/modules/student-documents/presentation/StudentDocumentsPortal.tsx`
- `src/__tests__/studentDocumentsPortal.test.tsx`

## Status

CODE-LEVEL CLOSED — STUDENT DOCUMENTS METADATA UI PARITY; submitted for CTO/consultant review.
