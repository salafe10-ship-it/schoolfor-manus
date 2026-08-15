# RELEASE-CONTRACT-002 — DMS and Notification Canonical Evidence

**Mission:** `PROGRAM-RELEASE-P0-002 / RELEASE-CONTRACT-002`  
**Mode:** Read/discovery contract resolution only  
**Date:** 2026-08-13  
**Decision:** `018 = BLOCKED` / `019 = BLOCKED`

## Executive result

The owner decisions are recorded, but the repository does not contain enough approved evidence to produce a safe implementation contract for either legacy path without inventing columns or changing business ownership.

## 018 — DMS

### Proven evidence

- `src/database/repositories/DocumentRepository.ts` reads `dms_documents` and maps the following fields: `id`, `tenant_id`, `file_name`, `file_size`, `uploaded_by`, `uploaded_date`, `status`, and `checksum`.
- The same repository’s canonical write callback is empty; it does not prove a DMS write contract.
- `src/types.ts` defines `DocumentMetadata` with `id`, `tenantId`, `fileName`, `fileSize`, `uploadedBy`, `uploadedDate`, `status`, `checksum`, and optional `version`, `description`, `tags`, and `moduleContext`.
- `src/database/services/DocumentService.ts` calls `saveMetadata` and therefore depends on the unresolved repository writer.
- The active Student Documents implementation uses a separate `student_documents` path.

### Not proven

- No `dms_documents` table definition or approved migration was found in the inspected repository.
- Student association, document reference, title, classification, lifecycle semantics, version persistence, and tenant ownership are not proven for `dms_documents`.
- Read-after-write, empty-result, and canonical error semantics are not proven.

### Decision

`018 = BLOCKED — DMS SCHEMA EVIDENCE STILL INSUFFICIENT`

Required next input: an approved `dms_documents` schema/ownership contract or formal approval to redirect the legacy repository to the existing Student Documents canonical contract.

## 019 — Notifications

### Proven database evidence

`supabase/migrations/202608051400_governance_platform.sql` defines `notification_queue` with:

- `tenant_id`;
- `recipient_user_id`;
- `recipient_address`;
- `channel`;
- `payload`;
- `idempotency_key`;
- `priority`;
- `status`;
- retry and delivery timestamps;
- tenant-scoped recipient foreign key `(tenant_id, recipient_user_id)`;
- queue status/channel constraints and processing indexes.

### Proven application mismatch

- `src/types.ts` `Notification` has `tenantId`, `schoolId`, `branchId`, `createdBy`, message fields, channel, status, and retry count, but no `recipientUserId`.
- `src/database/repositories/NotificationRepository.ts` writes to `notifications`, not `notification_queue`.
- The same repository’s `getInbox` reads fallback storage and compares `tenantId` with the requested `userId`; that is not a valid recipient mapping.
- `src/modules/notifications/types.ts` has `recipientId`, but it is a separate request contract and does not prove the legacy repository mapping or trusted tenant ownership.

### Not proven

- No safe mapping from the legacy `Notification` contract to `recipient_user_id`.
- No approved mapping for payload/content, status lifecycle, channel normalization, or tenant/school/branch ownership.
- No canonical read/write parity or empty-versus-error semantics.

### Decision

`019 = BLOCKED — NOTIFICATION SCHEMA EVIDENCE STILL INSUFFICIENT`

Required next input: approve the recipient field/API mapping and the trusted source for recipient identity. `tenantId` and `createdBy` must not be substituted for recipient identity.

## Scope protection

This mission changed documentation only. No repository, service, API, database, SQL, migration, RLS, RPC, storage, staging, or production resource was modified.
