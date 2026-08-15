# STU-AFFAIRS-P1-006-06 — Student Documents Validation

## Static validation

| Check | Result | Evidence |
|---|---|---|
| Authentication → permission → tenant order | PASS | Every reviewed document route follows the required middleware order |
| Trusted tenant context | PASS | `studentDocumentContext` rejects missing context; identity/scope are server-derived |
| Cross-tenant/school/branch protection | PASS at code level | Repository queries use trusted context fields; registration asserts the student is in scope |
| Client audit metadata trust | PASS at code level | Actor, audit IDs, request/correlation IDs and timestamps are server-side |
| Atomic registration | PASS at code level | Document, first version, audit, and outbox share one UnitOfWork |
| Atomic version update | PASS at code level | Current-version update, new version, parent update, audit, and outbox share one UnitOfWork |
| Atomic verification/archive | PASS at code level | Domain update, access log, audit, and outbox share one UnitOfWork |
| Idempotency | PASS at code level | Mutating commands require namespaced `Idempotency-Key` and reuse stored results |
| Optimistic concurrency | PASS at code level | `expectedVersion` and `FOR UPDATE` are used for mutable records |
| Rollback | PASS in existing tests | `studentDocumentService.test.ts` covers commit failure and rollback |
| Unauthorized user | PASS in existing tests | Permission tests and portal 403 handling exist |
| Missing student/context | PASS at code level | Context is mandatory; `assertStudentInScope` precedes registration |
| False-success UI | PASS at code level | Success notifications occur only after awaited responses; errors show warnings |
| Fallback write | PASS | No FallbackStorage write path found in the canonical document service/repository |
| Binary storage/upload/download | NOT IMPLEMENTED | The module is explicitly metadata-only and has no storage/provider contract |

## Existing test evidence

- `src/__tests__/studentDocumentService.test.ts`: validation bounds, trusted tenant/actor, rollback, required reason, lifecycle rejection, and idempotency namespace.
- `src/__tests__/studentDocumentAuthorization.test.ts`: six approved permissions and unknown-permission rejection.
- `src/__tests__/studentDocumentsPortal.test.tsx`: empty state, details/version rendering, 403 denial, and stale-version conflict recovery.

## Boundary and status

No live Staging operation was executed in this discovery mission. Code-level evidence is not a substitute for live cross-tenant testing. Database/RLS/SQL/migrations were not changed.

**STU-AFFAIRS-P1-006-06 = DISCOVERY COMPLETE / CODE-LEVEL CANONICAL PATH CONFIRMED / READY FOR CTO REVIEW**

