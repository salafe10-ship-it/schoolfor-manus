# DB-001-NONACC-019 — Notification Canonical Read/Write Parity

## Decision

**DB-001-NONACC-019 = BLOCKED — RECIPIENT USER CONTRACT GAP**

## Proven contract

- The governance migration defines `notification_queue`.
- The table has `tenant_id` and `recipient_user_id`, with a tenant-scoped foreign key to `users`.
- The owner decision selects `notification_queue` as canonical source and `user_id` as recipient ownership.

## Blocking evidence

`src/types.ts` defines `Notification` with `tenantId`, `schoolId`, and `createdBy`, but no `recipientUserId`. The existing `getInbox` implementation compares `tenantId` to the requested user ID, which is not a valid recipient mapping. Using `tenantId` or `createdBy` as `recipient_user_id` would misrepresent ownership and change the business contract.

## Required decision

Approve a recipient field and its API/service mapping, or provide an existing trusted source for recipient user identity. Do not substitute tenant or actor identity.

No notification code, schema, SQL, migration, RLS, staging, or production resource was changed by this blocked review.
