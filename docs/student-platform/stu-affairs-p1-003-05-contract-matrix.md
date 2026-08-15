# STU-AFFAIRS-P1-003-05 — Bulk Contract Matrix

## Contract comparison

| Layer | Current contract | Evidence | Result |
|---|---|---|---|
| Import UI | No file submission; modal states unavailable | `StudentAffairsPortal.tsx` import modal | Not operational |
| Client bulk service | `studentsList: any[]` | `StudentAffairsService.ts` | Legacy wrapper |
| Client repository | `JSON.stringify(studentsList)` to `/api/students/bulk` | `student-affairs/repository/StudentRepository.ts` | Mismatch: missing `operation` and `items` |
| API body | `{ operation, items }` | `server.ts` bulk route | Server expects envelope |
| API validation | No runtime validation of operation shape or item shape | `server.ts` | Unsafe |
| Service dispatch | insert/update/delete/transfer/promote/archive branches | `StudentService.executeBulkOperation` | Legacy dispatch |
| Transaction | Outer UnitOfWork plus delegated operations | `StudentService.ts` and prior RCA | Nested transaction risk |
| Tenant | Identity school ID; no full tenant middleware on route | `server.ts` | Not canonical |
| Authorization | `Student.Write` only | `server.ts` | Permission exists; per-operation authorization is not proven |
| Audit | Server-created metadata plus legacy `AuditRepository.log` | route/service | No canonical bulk event/outbox proof |
| Idempotency | No request key/payload hash | all inspected paths | Missing |
| Response | `success`, `data`, `meta.processedCount` | `server.ts` | May report success for unsupported runtime operation |

## Per-operation flow matrix

| Operation | UI payload | Repository payload | Server/service | Transaction | Tenant | Audit/outbox | Disposition |
|---|---|---|---|---|---|---|---|
| insert/import | raw array in legacy wrapper; no active importer | raw array | expects envelope; dispatches create loop | outer plus nested create risk | identity school only at route | legacy audit; outbox not proven | BLOCKED / separate import contract |
| update | no active UI caller | `{id, data}` only in legacy repository; generic API uses `{id, updates}` | legacy update loop | nested UoW risk | not full canonical context | legacy audit | UNSAFE / separate contract |
| delete | no active UI caller | IDs/actions in legacy helper; generic API uses `{id, action}` | legacy delete loop | nested UoW risk | not full canonical context | legacy audit | UNSAFE / separate contract |
| archive | no active UI caller | no active client contract | generic API uses `{id, archive}` | nested UoW risk | not full canonical context | legacy audit | UNSAFE / separate contract |
| promote | no active UI caller | `{id,targetClass,targetStage}` legacy helper; generic API uses `{id,promotion}` | legacy promotion loop | nested UoW risk | not full canonical context | legacy audit | UNSAFE / separate contract |
| transfer | selected IDs/stage/grade/section held in disabled UI; no request | legacy helper updates each student | generic API can dispatch transfer | known nested transaction conflict | no canonical Enrollment context | no approved transfer outbox/idempotency | BLOCKED BY P0-002P |

## Required contract decisions before implementation

1. Separate canonical Student Import from Batch Transfer.
2. Decide whether import is a Student Registration batch or a dedicated import aggregate.
3. Define envelope, item schema, limits, idempotency, duplicate handling, and error report.
4. Require full trusted TenantContext and operation-specific permissions.
5. Define one transaction boundary without nested delegated UnitOfWork calls.
6. Define canonical audit/change-set/outbox events and replay behavior.

