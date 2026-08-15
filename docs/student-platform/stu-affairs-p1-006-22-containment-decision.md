# STU-AFFAIRS-P1-006-22 — Lifecycle Containment Decision

## Mission mode

Architecture, security, and domain decision package only. No route, service, repository, authorization, tenant, Unit of Work, database, migration, RLS, staging, or production change was made.

## Decision

`P1-006-22 = CONTAINMENT PLAN READY — DOMAIN/SECURITY OWNER APPROVAL REQUIRED`

## Containment principle

The Student Affairs lifecycle must converge to one approved contract:

`One Canonical Lifecycle Contract → Operation-specific command → Trusted Scope → Domain validation → One transaction boundary → History + Audit + Outbox`

The current system must not promote a Legacy writer to canonical status by renaming it or by adding a second wrapper around it.

## Operation decisions

| Operation | Active today? | Current writer | Risk | Canonical target | Proposed temporary state | Required owner |
|---|---:|---|---|---|---|---|
| Promote | Yes | Legacy `StudentPromotionService` / `StudentRepository.update` | P1 | Enrollment/Placement + Academic Lifecycle | BLOCKED / GATED until domain contract | Academic |
| Re-enroll | Yes | Legacy `StudentEnrollmentService` / `StudentRepository.update` | P1 | Enrollment + Academic Lifecycle | BLOCKED / GATED until Enrollment contract | Academic |
| Dismiss | Yes | Legacy `StudentEnrollmentService` / `StudentRepository.update` | P1 | Academic Lifecycle | BLOCKED / GATED until status decision | Domain |
| Suspend | Yes | Legacy dismiss branch or canonical suspend branch depending on caller | P1 | Academic Status | BLOCKED / GATED until one writer is approved | Domain |
| Archive | Yes | Legacy POST archive branch and canonical DELETE soft-delete branch | P1 | Academic Lifecycle / archival policy | BLOCKED / GATED; canonical-only target | Domain |
| Restore | Mixed | Canonical DELETE restore plus Legacy POST `archive=false` | P1 | Correction workflow or explicitly approved restore contract | Canonical-only; Legacy restore must not become canonical | Domain |
| Bulk Promote | Yes through API | Bulk → Legacy promotion writer | P1 / P0 candidate | Bulk Lifecycle command | BLOCKED | Security + Domain |
| Bulk Archive | Yes through API | Bulk → Legacy archive writer | P1 / P0 candidate | Bulk Lifecycle command | BLOCKED | Security + Domain |
| Bulk Transfer | Yes through API | Bulk → Legacy transfer writer | P0 dependency | `TransferOperation` | BLOCKED | Security + Operations |
| Bulk unknown operation | Endpoint accepts untrusted runtime value | Generic no-op branch followed by generic success envelope | Containment risk | Explicit operation enum and rejection | FAIL-CLOSED required | Security |

“BLOCKED / GATED” is a design recommendation requiring owner approval. This document does not apply it in code.

## Required decisions before implementation

1. Choose the single canonical owner of lifecycle state: Academic Status, with Enrollment as the owner of placement and enrollment closure.
2. Define whether Promote changes only placement or also lifecycle state.
3. Define Re-enroll as a new Enrollment command, not a string status replacement.
4. Define temporary suspension versus permanent withdrawal/dismissal.
5. Define Archive as terminal archival and define correction/restore separately.
6. Define operation-specific permissions, approval requirements, reason codes, effective dates, and audit fields.
7. Define one transaction boundary and one request/idempotency contract for each operation.
8. Define the Bulk policy: either a canonical batch command or explicit fail-closed rejection until it exists.

## No implementation authorization

The following remain untouched by this mission: routes, `StudentService`, `StudentLifecycleManager`, `StudentRepository`, Bulk endpoint, `AuthorizationEngine`, `PermissionRegistry`, `TenantEngine`, `UnitOfWork`, Enrollment, Lifecycle, DB/SQL/Migrations/RLS, Staging, and Production.

