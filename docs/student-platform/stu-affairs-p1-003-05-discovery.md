# STU-AFFAIRS-P1-003-05 — Bulk Contract Discovery

## Scope and decision

Discovery only. No source code, database, migration, RLS, RPC, production, or batch-transfer behavior was changed.

The Student Affairs bulk surface is fragmented. The only server route is `POST /api/students/bulk`, but the client repository sends a raw array while the server expects `{ operation, items }`. The visible batch-transfer UI is disabled and does not call the route.

## Bulk operation inventory

| Operation | UI status | Client path | API path | Classification |
|---|---|---|---|---|
| Student import/create | Import modal explicitly unavailable; no file is accepted | `StudentAffairsService.bulkCreateStudents` → `StudentRepository.bulkCreateStudents` sends raw array | `/api/students/bulk` expects object | LEGACY / CONTRACT MISMATCH / NOT OPERATIONAL |
| Generic insert | No active UI caller found | No active caller found | `operation=insert` → `StudentService.executeBulkOperation` | UNSAFE LEGACY PATH |
| Generic update | No active UI caller found | No active caller found | `operation=update` → legacy StudentService update loop | UNSAFE LEGACY PATH |
| Generic delete | No active UI caller found | No active caller found | `operation=delete` → legacy delete loop | UNSAFE LEGACY PATH |
| Generic archive | No active UI caller found | No active caller found | `operation=archive` → legacy archive loop | UNSAFE LEGACY PATH |
| Batch transfer | Visible wizard is disabled; handler only warns and performs no request | Selected IDs plus stage/grade/section are held in UI state | No request is issued | BLOCKED BY P0-002P / DO NOT TOUCH |
| Batch promote | No active UI caller found; only legacy repository helper exists | Legacy `StudentRepository.bulkPromote` loops updates | No proven active API contract | LEGACY / UNSAFE |
| Batch restore | No active UI caller found; only legacy repository helper exists | Legacy `StudentRepository.bulkRestore` loops updates | No proven active API contract | LEGACY / UNUSED |
| Batch transfer helper | No active UI caller found; only legacy repository helper exists | Legacy `StudentRepository.bulkTransfer` loops updates | No proven active API contract | LEGACY / BLOCKED |

## Active server route evidence

`server.ts` exposes `POST /api/students/bulk`, authenticates the request, checks `Student.Write`, reads `operation` and `items`, creates server-side audit metadata, and calls `StudentService.executeBulkOperation`.

The route does not call `resolveStudentTenantMiddleware` or `resolveStudentTenantContext` before the bulk service. It derives `schoolId` from the authenticated identity, but the route does not establish the full canonical TenantContext used by the approved Student registration and Guardian paths.

## Safety observations

- The bulk service opens an outer `UnitOfWork`, then delegates each item to services that may open their own UnitOfWork. Existing project evidence identifies nested-transaction rejection for transfer items.
- Runtime operation validation is missing. An unknown operation can pass through the loop without processing an item and still return a successful response with `processedCount` equal to the input length.
- The route converts every failure into a generic `DatabaseError`, including validation and authorization failures.
- No batch idempotency key or payload-hash replay contract is present.
- No canonical Enrollment Transfer, transfer history, or outbox contract is proven for bulk transfer.
- The legacy repository helpers perform per-item loops and are not a proof of atomic persistence.

## Discovery conclusion

There is no safe bulk implementation to enable in this mission. Bulk Import requires a separate canonical import contract; generic bulk mutations require a transaction-aware composition and trusted tenant boundary; Batch Transfer remains explicitly blocked by P0-002P and must not be implemented here.

