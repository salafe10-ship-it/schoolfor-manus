# STU-GUARDIAN-001 — Failure RCA

## Decision

**BLOCKED + RCA**

## Root cause

Guardian data evolved through multiple implementation generations without a single enforced boundary: legacy `parentName`/`parentPhone` fields, a composite UnitOfWork admission path, direct repositories, global fallback storage, and separate migration/schema definitions all remain active or callable.

## Contributing causes

1. `StudentGuardianRepository` accepts `schoolId` but does not apply it to its queries or fallback lookups.
2. The Guardian service creates one synthetic guardian from legacy fields instead of mapping the approved guardian form/aggregate.
3. Direct repository writes can bypass the composite UnitOfWork and audit path.
4. `syncGuardians` reads fallback storage instead of the authoritative relationship repository.
5. Guardian-specific outbox/domain-event evidence is absent.
6. Live RLS and live schema evidence are unavailable, so database-level mitigation cannot be certified.

## Why the mission cannot proceed

Proceeding to Guardian hardening or production certification would risk cross-tenant relationship access, data corruption through synthetic values, partial writes, and untraceable changes. Fixing these requires source changes and potentially a schema/RLS decision, both outside Discovery-only authority.

## Required approval for next mission

Approve a separate hardening mission with explicit scope for canonical writer consolidation, trusted tenant context, transaction atomicity, guardian field mapping, audit/outbox coverage, and live RLS/schema verification. Until then, keep Guardian Platform status **BLOCKED + RCA**.

