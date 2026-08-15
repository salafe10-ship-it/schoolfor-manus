# DB-001-NONACC-003 — Notification Read/Write Canonical Parity

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-003`  
**Mode:** Bounded static/read-only audit  
**External mutation:** None  
**Decision:** `BLOCKED — NOTIFICATION CANONICAL CONTRACT/SCHEMA DEPENDENCY`

## Findings

1. `NotificationRepository.create` calls `supabase.from('notifications').insert([notification])` but does not inspect or throw on the returned Supabase `error`. A rejected promise is caught by `FallbackStorage.performWrite`, but a resolved Supabase response containing `{ error }` can be treated as successful.
2. `NotificationRepository.getInbox` reads only from `FallbackStorage.getNotifications()` and never attempts a canonical read. This creates a write/read source mismatch whenever canonical persistence is active.
3. The inspected source does not contain an approved `notifications` table contract, migration, or canonical field mapping that establishes whether inbox ownership is keyed by `tenant_id`, `user_id`, recipient ID, or another approved field. The existing fallback filter compares `tenantId` to `userId`, which is not enough evidence to invent a PostgreSQL query.

## Why the mission is blocked

Adding a guessed canonical query or mapping would require an unapproved schema/API/recipient contract and could expose notifications across users or schools. Modifying `FallbackStorage` or creating a new source of truth is explicitly forbidden.

The write error check is locally understandable, but implementing it alone would leave `getInbox` fallback-only and would not close the mission’s required parity gate. Therefore no partial code change is presented as a closure.

## Safety outcome

- No false parity is claimed.
- No `FallbackStorage` modification.
- No database, SQL, migration, RLS, API, authorization, tenant, production, or staging change.
- No automatic mutation retry.

## Required decision

Provide an approved canonical notification contract containing:

- canonical table and column names;
- tenant/school/branch scope;
- recipient/inbox ownership field and semantics;
- row mapping and empty-vs-error behavior.

Then open a bounded implementation mission for the repository.
