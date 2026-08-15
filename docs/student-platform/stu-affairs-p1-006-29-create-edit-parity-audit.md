# STU-AFFAIRS-P1-006-29 — Student Create/Edit Persistence Parity Audit

Status: `PARITY GAPS IDENTIFIED — BOUNDED FIXES / DOMAIN DEPENDENCIES REQUIRED`

## Scope

Discovery only. The audit compares:

`Student Registration ↕ Student Edit ↕ Canonical Student Read`

No code, API, database, SQL, RLS, migration, Enrollment, Academic Status, Authorization, TenantEngine, UnitOfWork, staging, or production change was made.

## Executive result

Create and Edit share the main canonical identity fields, but they are not fully parity-safe:

- Create persists `birth_country_code`, while the Student read projection omits it and Edit cannot update it.
- Create enforces registration, guardian, term, idempotency, duplicate, and academic-context requirements that Edit does not and should not repeat as a profile patch.
- Create emits the full registration transaction/audit/outbox/status chain; Edit emits a Student audit event but no equivalent registration outbox/status chain.
- Edit requires a valid optimistic version and can reject an empty student number, while Create can accept an absent number for server-side generation.
- Read returns Guardian projections and Enrollment placement, but not all Student-owned or registration-persisted fields.

These are contract differences, not evidence of a direct cross-tenant or false-success persistence bypass after P1-006-28.

## Parity summary

| Dimension | Result |
|---|---|
| Main Student identity fields | PARTIAL parity |
| Birth country | CREATE-only persistence / READ-EDIT gap |
| Guardian | Separate create registration vs edit Guardian workflow |
| Enrollment placement | Read projection only; Enrollment-owned |
| Validation | Intentionally different workflows, but not documented as one contract |
| Version/concurrency | Create starts at version 1; Edit requires expected version and increments |
| Audit | Both audited, different event scope |
| Outbox/status history | Create only |
| Tenant/scope | Trusted context used in both observed canonical paths |
| Success semantics | P1-006-28 corrected Profile UI wording; canonical response still has workflow-specific metadata |

## Decision

`P1-006-29 = PARITY GAPS IDENTIFIED — BOUNDED FIXES / DOMAIN DEPENDENCIES REQUIRED`

The next fix must be bounded to an approved contract. No mapping for `birthCountryCode`, contact data, national ID, placement, status, audit/outbox, or version behavior should be invented in this audit.
