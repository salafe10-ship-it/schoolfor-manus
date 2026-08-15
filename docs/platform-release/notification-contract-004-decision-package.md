# NOTIFICATION-CONTRACT-004 — Final Notification Contract Decision Package

**Mission:** `PROGRAM-RELEASE-P0-002 / NOTIFICATION-CONTRACT-004`  
**Mode:** Discovery and contract decision only  
**Date:** 2026-08-13  
**Decision:** `BLOCKED — OWNER/ARCHITECTURE DECISION REQUIRED`

## 1. Purpose

This package records the evidence needed before implementing parity between the application notification contract and the canonical `notification_queue`. It deliberately records gaps without inventing mappings.

## 2. Canonical source and security boundary

### Proven

- The approved canonical source is `notification_queue`.
- The database migration `supabase/migrations/202608051400_governance_platform.sql` defines `tenant_id`.
- The migration defines `recipient_user_id` and a tenant-scoped foreign key to `users`.
- The intended isolation boundary is `tenant_id` and the canonical recipient field is `recipient_user_id`.
- The current repository must not use `tenantId === userId` or `createdBy` as a substitute for recipient identity.

### Not yet proven

- The application `Notification` type does not currently contain `recipientUserId`.
- No approved application-contract change has been supplied to add that field.

## 3. Decision register

| Area | Application evidence | Canonical database evidence | Decision status | Required approval |
|---|---|---|---|---|
| Priority | `low`, `normal`, `high`, `urgent`, `critical` | integer | `OWNER/ARCHITECTURE DECISION REQUIRED` | Official text-to-integer table, or approval to align the contracts without conversion |
| Channel | includes `system`, `email`, `sms`, `whatsapp`, `push`, `teams`, `slack`, `webhook` | `email`, `sms`, `push`, `in_app`, `webhook` | `OWNER/ARCHITECTURE DECISION REQUIRED` | Official mapping and disposition of unsupported values |
| Payload | separate module/reference/category/subject/body/language fields | `payload jsonb` | `OWNER/ARCHITECTURE DECISION REQUIRED` | Approved payload structure and field names |
| Status | `pending`, `queued`, `sending`, `sent`, `read`, `failed`, `archived` | `queued`, `processing`, `delivered`, `failed`, `dead_letter` | `OWNER/ARCHITECTURE DECISION REQUIRED` | Explicit lifecycle mapping, including `read` and `archived` |
| Recipient | no `recipientUserId` in `src/types.ts` | `recipient_user_id` | `OWNER/ARCHITECTURE DECISION REQUIRED` | Approval that the application field is `recipientUserId` and may be added to the contract |

## 4. Prohibited assumptions

The following mappings are not approved and must not be introduced by engineering:

- `high = 3` or any other priority scale;
- `system = in_app`;
- `sent = delivered`;
- `read = delivered`;
- `archived = dead_letter` or any other status conversion;
- automatic placement of application fields into `payload` without an approved payload contract;
- use of `tenantId` or `createdBy` as recipient identity;
- silent dropping of unsupported channels or statuses.

## 5. Existing implementation evidence

- `src/database/repositories/NotificationRepository.ts` currently writes to `notifications` and reads the inbox from `FallbackStorage`.
- Its current inbox predicate compares `tenantId` to the requested `userId`, which is not a valid canonical recipient mapping.
- The repository therefore cannot be changed safely until the decision register is completed.

## 6. Gate decision

`NOTIFICATION-CONTRACT-004 = BLOCKED — OWNER/ARCHITECTURE DECISION REQUIRED`

The contract is not ready for implementation. Once the five decisions above are formally approved, the consultant may issue a new, bounded implementation order for `DB-001-NONACC-019`.
