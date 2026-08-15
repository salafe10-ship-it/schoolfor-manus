# GUARDIAN-CONTRACT-001 — Student Guardian Business & Relationship Contract

## Contract status

**CONTRACT APPROVED — IMPLEMENTATION AUTHORIZED IN GUARDIAN-003 ONLY**

This document records the approved business contract. Implementation remains a separate mission and must not change schema, RLS, authorization core, TenantEngine, or UnitOfWork.

## A. Guardian model

- `Guardian` is an independent person/entity.
- `StudentGuardian` is the relationship entity between a Student and a Guardian.
- One Guardian may be related to many Students.
- One Student may be related to many Guardians.
- The same person must not be duplicated as a new Guardian merely because they are linked to another student.
- Duplicate relationship rows for the same Student–Guardian relationship are prohibited.

## B. Approved relationship rules

| Relationship | Separate Guardian entity | Primary allowed | Financial liability | Custody | Emergency contact | Notification consent | Multiple per student |
|---|---|---|---|---|---|---|---|
| Father | Yes | Yes, subject to one-primary rule | Independent | Independent | Optional independent flag | Independent | Yes |
| Mother | Yes | Yes, subject to one-primary rule | Independent | Independent | Optional independent flag | Independent | Yes |
| Legal guardian | Yes | Yes, subject to one-primary rule | Independent | Independent | Optional independent flag | Independent | Yes |
| Other | Yes | Yes, subject to one-primary rule | Independent | Independent | Optional independent flag | Independent | Yes |

Canonical relationship enum for GUARDIAN-003:

`father`, `mother`, `legal_guardian`, `other`

No additional relationship value may be added in GUARDIAN-003. `other` must not conceal a known relationship that requires a later contract amendment.

## C. Primary Guardian

- At most one Primary Guardian is allowed per Student at a time.
- A Guardian is not Primary automatically merely because a relationship is created.
- Changing Primary is an explicit operation.
- Creating a new Guardian or relationship must not silently replace the current Primary Guardian.

## D. Financial liability

- Financial liability is independent from Primary Guardian status.
- The financially liable person may differ from the Primary Guardian.
- No implementation may assume `Primary = Financial`.

## E. Custody

- Custody is independent from family relationship and financial liability.
- Father/Mother status does not imply custody.
- GUARDIAN-003 must not invent custody values. If the current data contract cannot represent an approved custody value, the value remains absent rather than fabricated.

## F. Emergency contact

- Emergency contact is an independent relationship capability.
- A Guardian may be an emergency contact, but every Guardian is not automatically an emergency contact.
- GUARDIAN-003 must not create a new Emergency Contact entity outside this contract.

## G. Notifications and SMS consent

Notification consent is independent from:

- Primary status
- Financial liability
- Custody
- Relationship type

Neither `Primary = SMS consent` nor `Financial = SMS consent` is a valid rule.

## H. Father and Mother

- Father and Mother are separate official relationship types.
- If both exist, each is an independent Guardian with its own StudentGuardian relationship.
- Father and Mother must never be merged into one Guardian record.

## I. Legacy mapping

- `parentName` and `parentPhone` are legacy/compatibility data only.
- Legacy fields are not evidence that the person is Father or Mother.
- Do not map `parentName → father` or `parentName → mother` by inference.
- Preserve legacy values; do not delete them.
- Do not convert legacy values into a canonical Guardian relationship without reliable relationship evidence.

## J. Missing parent

Absence of Father or Mother is allowed. Both are not required.

Valid states include:

- Father only
- Mother only
- Both
- Neither

If another operation requires a Guardian for its own purpose, that requirement must be stated in that operation’s contract and must not be inferred from Father/Mother presence.

## K. Synthetic/default data

Authoritative records must never be created with synthetic values such as Unknown Father, Default Parent, Test Guardian, fabricated national IDs, fabricated emails, or fabricated addresses.

When information is unknown, use the approved nullable/absent representation or an explicitly missing state. Do not invent data to satisfy validation.

## L. Engineering invariants

- Client values for `tenantId`, `schoolId`, `branchId`, `actorId`, and `role` are never trusted.
- Every Guardian/StudentGuardian operation uses trusted authenticated identity and trusted tenant/school/branch context.
- Composite `Guardian + StudentGuardian + Student + Audit + Outbox` work is one atomic operation when required by the existing contract.
- A failed relationship write must not leave an orphan Guardian when the original operation requires both records.
- No schema, migration, RLS, authentication, authorization core, TenantEngine, or UnitOfWork changes are part of GUARDIAN-003.

## Approval

**GUARDIAN-CONTRACT-001 = CONTRACT APPROVED**

Next authorized mission: **GUARDIAN-003 — Canonical Guardian Writer Consolidation & P0 Tenant-Scope Hardening**.

