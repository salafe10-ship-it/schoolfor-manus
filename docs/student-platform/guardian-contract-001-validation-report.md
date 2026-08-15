# GUARDIAN-CONTRACT-001 — Validation Report

## Mission scope

Documentation-only business and architecture contract. No React, service, repository, schema, migration, RLS, authentication, authorization, tenant engine, UnitOfWork, fixture, or production change was performed by the contract mission.

## Approved decision coverage

| Contract area | Result |
|---|---|
| Guardian entity ownership | APPROVED — Guardian is independent; StudentGuardian owns the relationship. |
| Father/Mother model | APPROVED — separate official relationship types and separate Guardian records. |
| Primary Guardian | APPROVED — at most one current Primary per Student; explicit change only. |
| Financial liability | APPROVED — independent from Primary. |
| Custody | APPROVED — independent; no inferred/fabricated values. |
| Emergency contact | APPROVED — independent capability; Guardian may be emergency contact. |
| Notification consent | APPROVED — independent from relationship, Primary, financial, and custody. |
| Relationship enum | APPROVED — `father`, `mother`, `legal_guardian`, `other` only for GUARDIAN-003. |
| Parent legacy mapping | APPROVED — compatibility data only; no automatic Father/Mother inference. |
| Missing parent | APPROVED — Father only, Mother only, Both, or Neither are valid. |
| Multiple Guardians | APPROVED — Student → many Guardians and Guardian → many Students. |
| Guardian identity reuse | APPROVED — same person is one Guardian with multiple relationships. |
| Synthetic/default data | APPROVED — prohibited for authoritative records. |

## Engineering constraints for GUARDIAN-003

- Trusted tenant/school/branch context is mandatory.
- Client-selected identity, tenant, school, branch, actor, and role are rejected as sources of truth.
- Composite Guardian/StudentGuardian/Student/Audit/Outbox work is atomic when required by the existing operation.
- No orphan Guardian may remain after a required relationship failure.
- Schema, migration, RLS, authorization core, TenantEngine, and UnitOfWork are outside GUARDIAN-003.

## Validation

| Check | Result |
|---|---|
| Contract completeness | PASS |
| No unresolved business `TBD` decisions | PASS |
| No source modification | PASS |
| No database or production mutation | PASS |
| `git diff --check` | PASS |
| Secret scan | PASS |

## Readiness decision

**GUARDIAN-CONTRACT-001 = CONTRACT APPROVED**

The next authorized mission is GUARDIAN-003 only.

