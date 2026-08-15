# STU-AFFAIRS-P0-003-02 — Discovery Validation Report

## Scope and safety

This report records static discovery only. No source-code fix, SQL, migration execution, RLS change, database mutation, Production action, TransferOperation, or general infrastructure change was performed.

## Validation commands and results

| Check | Result | Notes |
|---|---|---|
| Guardian repository isolation test | **PASS** | `src/__tests__/studentGuardianRepositoryIsolation.test.ts`: 1 file, 6 tests passed. Covers missing trusted context, tenant/school/branch filtering, caller-selected scope rejection, foreign relationship rejection, trusted Supabase predicates, and client-scope stripping. |
| TypeScript | **PASS** | `tsc --noEmit` completed with exit code 0. |
| Diff whitespace check | **PASS** | `git diff --check` completed with exit code 0. Git reported only existing LF/CRLF normalization warnings for dirty files. |
| Production build | **NOT RERUN IN THIS DISCOVERY PASS** | Previous approved P0-003-01 baseline recorded `vite build: PASS` and server bundle pass. No implementation code changed in this discovery pass. Must rerun before any Guardian repair is accepted. |
| Live Supabase / RLS | **NOT EXECUTED** | Explicitly outside this mission. |
| Migration execution | **NOT EXECUTED** | Explicitly outside this mission. |
| Production deployment | **NOT EXECUTED** | Explicitly outside this mission. |

## Static validation conclusions

### Scope and identity

- The canonical registration path derives tenant, school, branch, actor, audit, request, and correlation values from trusted server context.
- The legacy Guardian service receives only `schoolId` and raw Student data; it does not resolve a complete trusted TenantContext.
- The legacy Guardian identity is synthetic and can include a generated email and fixed business data.

### Persistence

- Canonical `guardians` and `student_guardians` are UUID-based and scope-aware in the approved SQL source.
- Legacy repositories still use camelCase records and local JSON fallback data.
- No dedicated Guardian API route was found in `server.ts`.
- Canonical Student edit does not persist submitted Guardian fields.

### Atomicity and failure behavior

- Canonical registration is request-scoped and atomic through `UnitOfWork.runInTransaction`.
- Legacy Guardian creation is enlisted from a different service path and the relationship caller supplies an incomplete join scope; the resulting fail-closed error is not a valid production Guardian workflow.
- Legacy synchronization is `void` and does not provide a dedicated persistence result to the Student update caller.
- Fallback queue writes return local data and replay by id without complete tenant/branch validation; this is not accepted as proof of a committed canonical Guardian change.

### Audit and recovery

- Canonical Guardian rows carry audit/request/correlation references and canonical registration queues an audit event/outbox event in the same transaction.
- Legacy Guardian enlist SQL does not carry the canonical audit/request/correlation contract.
- Fallback queue audit records are legacy `audit_logs` objects and default to a system sync actor when no context is supplied; they are not equivalent to the canonical append-only audit event contract.

## Required pre-implementation tests

The following tests are required before a future P0-003-02 repair can be accepted:

1. Canonical new Guardian creation commits with trusted tenant/school/branch and generated audit metadata.
2. Existing Guardian link rejects a foreign tenant, school, or branch.
3. Guardian update persists name/phone/email and increments version under expected-version control.
4. Student edit either atomically updates the Guardian or explicitly rejects unsupported Guardian changes; it must never return false success.
5. Duplicate Guardian match is deterministic within the trusted scope and safe under concurrent requests.
6. Missing TenantContext fails closed before any Guardian read/write.
7. Fallback/offline mode cannot return a successful production commit without the approved recovery contract.
8. Rollback removes Student, Guardian, relationship, audit, and outbox rows after any failure in the composite operation.
9. Bulk insertion cannot reach an uncertified Guardian path.
10. Full Student Affairs regression, full Vitest, TypeScript, Vite build, server bundle, and `git diff --check` pass after repair.

## Validation decision

`STU-AFFAIRS-P0-003-02 = READY FOR CTO REVIEW — DISCOVERY COMPLETE / REMEDIATION REQUIRED`

The focused repository test passing is not a certification of the legacy Guardian service. The P0 remains open until the canonical write boundary and fallback policy are explicitly approved and implemented.
