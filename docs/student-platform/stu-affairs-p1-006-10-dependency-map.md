# STU-AFFAIRS-P1-006-10 — Dependency Map

## Active canonical flow

```text
Application shell
  ↓
StudentAffairsPortal
  ├─ StudentRepository (browser API adapter)
  │    ↓
  │  authenticated server routes
  │    ↓
  │  Authorization / trusted tenant context
  │    ↓
  │  canonical Student services/repositories/UnitOfWork
  │    ↓
  │  PostgreSQL + audit/outbox
  │
  └─ StudentDocumentsPortal
       ↓
     /api/student-documents*
       ↓
     StudentDocumentService
       ↓
     StudentDocumentRepository
       ↓
     PostgreSQL metadata + audit/access log/outbox
```

## Legacy alternate flow (must remain blocked)

```text
Unimported legacy component
  ↓
local React state / notification-only handler
  ├─ simulated document upload → local securedDocs only
  ├─ static transport/library/uniform values
  ├─ direct old search delete Promise.all
  └─ local academic/guardian/medical mutation

This flow must not be reconnected to production by import alone.
```

## Component classification map

| Surface | Current downstream dependency | Classification | Re-activation requirement |
|---|---|---|---|
| `StudentAffairsPortal` | Canonical StudentRepository and StudentDocumentsPortal | CANONICAL | Existing permission/tenant/API contract |
| Legacy search panel | Older fetch/delete behavior | LEGACY-BLOCKED | New canonical list/action contract and transaction proof |
| Legacy timeline | Local events/print | LEGACY-BLOCKED | Canonical timeline endpoint and state coverage |
| Legacy document uploader | React state and notification | LEGACY-BLOCKED | Approved P1-006-10+ storage contract, API, scan, audit |
| Legacy academic panel | Local form state | LEGACY-BLOCKED | Enrollment/Academic Status service contract |
| Legacy guardian panel | Local form state | LEGACY-BLOCKED | Canonical Guardian aggregate/update route |
| Legacy medical panel | Local form state | LEGACY-BLOCKED | Sensitive-data permission and canonical repository |
| Legacy library/transport/uniform | Static UI; auxiliary repositories exist elsewhere | REQUIRES-OWNER-DECISION | Domain owner and cross-module transaction contract |
| `FallbackStorage` | Broader database services and migration paths | REQUIRES-OWNER-DECISION | Whole-repository dependency proof before any cleanup |

## Unsafe edges to prevent

1. Do not import `StudentSearchPanel` into the active portal; its bulk selection uses independent requests and `Promise.all` rather than the canonical transaction contract.
2. Do not import legacy `StudentDocuments`; it produces local simulated upload success without binary storage.
3. Do not reconnect static library, transport, or uniform buttons until their owning modules and accounting/inventory boundaries are approved.
4. Do not use local medical/guardian/academic panels as an authority for sensitive or lifecycle state.
5. Do not remove or change `FallbackStorage` from Student Affairs alone; it has non-Student Affairs callers.

## Route map

| Route family | Active consumer | Status |
|---|---|---|
| `/api/students` and `/api/students/:id/*` | Active StudentAffairsPortal/StudentRepository | CANONICAL; Student Read staging evidence remains observability-blocked |
| `/api/students/export` | Active export path | CANONICAL / STAGING PENDING |
| `/api/student-documents*` | StudentDocumentsPortal | CANONICAL metadata/lifecycle; binary storage absent |
| Generic `/api/students/bulk` | No approved canonical import path | BLOCKED / do not reactivate |

