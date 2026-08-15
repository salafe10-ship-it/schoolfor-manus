# STU-AFFAIRS-P1-006-22 — Operation Gating Matrix

| Operation | Route / caller | Current path | Current permission | Tenant context | Branch context | Item validation | History / audit / outbox | Gate recommendation |
|---|---|---|---|---|---|---|---|---|
| Promote | `POST /api/students/:id/promote` | Legacy service → repository update | Broad `Student.Write` | Route resolves student tenant; bulk does not visibly use resolver middleware | Not proven in writer contract | Student lookup and legacy transition only | Legacy audit; canonical history/outbox not proven | Gate until placement/lifecycle contract |
| Re-enroll | `POST /api/students/:id/re-enroll` | Legacy service → repository update | Broad `Student.Write` | Route tenant middleware; bulk inherited scope only | Not proven | Legacy status transition only | Legacy audit; Enrollment/history/outbox not proven | Gate until Enrollment contract |
| Dismiss | `POST /api/students/:id/dismiss` | Legacy service → repository update | Broad `Student.Write` | Route tenant middleware; bulk inherited scope only | Not proven | Reason/decision fields reach legacy notes | Legacy audit; Academic Status history not proven | Gate until domain/status contract |
| Suspend | Student POST status branch can reach canonical suspend; dismiss temporary branch is Legacy | Mixed | Broad `Student.Write` | Canonical path uses trusted context; legacy route uses middleware | Canonical branch scope is proven; legacy branch not equivalent | Different validation rules | Mixed | Choose one canonical writer |
| Archive | `POST /api/students/:id/archive` and DELETE soft-delete | Mixed Legacy + canonical | `Student.Write` vs `Student.Delete` | Canonical DELETE trusted context; legacy/bulk paths differ | Not equivalent | Different state transitions | Mixed | Canonical-only target |
| Restore | DELETE restore and POST archive=false | Mixed canonical + Legacy | `Student.Delete` vs `Student.Write` | Canonical DELETE trusted context; legacy path differs | Not equivalent | Canonical restore-status validation only on DELETE | Mixed | Correction/restore contract required |
| Bulk insert | `POST /api/students/bulk` | `executeBulkOperation` → create service | One broad `Student.Write` | `user.schoolId` only; no visible resolver middleware | No item branch validation proven | Per-item service checks vary | Mixed / not canonical | Block until batch contract |
| Bulk update | Same | `executeBulkOperation` → `StudentService.updateStudent` | One broad `Student.Write` | Same | No item branch authorization proven | Per-item legacy update | Legacy audit; no canonical batch history/outbox | Block until batch contract |
| Bulk delete | Same | `executeBulkOperation` → withdrawal service | One broad `Student.Write` | Same | No item branch authorization proven | Legacy constraints | Legacy audit; no canonical batch history/outbox | Block until batch contract |
| Bulk transfer | Same | `executeBulkOperation` → Enrollment legacy transfer | One broad `Student.Write` | Same | Target branch checks differ; no canonical transfer contract | Per-item legacy checks | Legacy audit; nested Unit of Work risk | Block; TransferOperation dependency |
| Bulk promote | Same | `executeBulkOperation` → promotion legacy writer | One broad `Student.Write` | Same | No item branch authorization proven | Per-item legacy checks | Legacy audit; no canonical batch history/outbox | Block |
| Bulk archive | Same | `executeBulkOperation` → archive legacy writer | One broad `Student.Write` | Same | No item branch authorization proven | Per-item legacy checks | Legacy audit; no canonical batch history/outbox | Block |
| Bulk unknown operation | Same | No operation branch, then generic response | Broad `Student.Write` | Same | No item validation | Audit success can still be reached statically | Fail-closed rejection required | Block / reject explicit enum |

## Approval ownership

- Academic owner: Promote and Re-enroll semantics.
- Domain owner: Dismiss, Suspend, Archive, Restore lifecycle semantics.
- Security owner: operation-specific permissions, tenant context, item scope, and unknown-operation rejection.
- Operations owner: Bulk availability, retry, idempotency, partial failure, and support procedure.

