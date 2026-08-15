# STU-AFFAIRS-P1-006-57 — Implementation Report

## Scope

This change hardens the Student Documents detail workflow so action visibility reflects the canonical document state returned by the existing API. No permissions, lifecycle rules, API routes, repositories, services, database objects, RLS, storage, authentication, or tenant behavior were changed.

## Implemented

- Verification and rejection are shown only for `pending_verification` documents with a current version.
- Expiry is shown only when the document is not archived or already expired, has a current version, is not under legal hold, and the canonical retention date is due.
- Archive is shown only when the document is not archived, is not under legal hold, and the canonical archive-eligibility date is due.
- Restore remains available only for archived documents.
- Add Version remains available only for non-archived documents with a current version and is disabled while another mutation is in flight.
- Access-history loading and retry are read-only and disabled while a mutation is in flight.
- Mutation failures update the accessible announcement and warning path without emitting a success notification.
- Successful mutations continue to refresh the list and details from canonical endpoints before success is announced.

## Compatibility

The UI consumes the existing service contract only. Server-side authorization remains authoritative; hidden actions are a truthful presentation boundary, not a security boundary.
