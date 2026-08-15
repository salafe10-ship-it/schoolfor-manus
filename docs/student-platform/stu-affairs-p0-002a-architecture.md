# STU-AFFAIRS-P0-002A — Architecture Decision

## 1. Recommended Boundary

The safest recommendation is a **Student Affairs Batch Transfer Application Service** that coordinates existing approved single-student business rules without making the UI, legacy repository or generic bulk route canonical.

This is a recommendation only. It is not an implementation authorization.

The service should own one request-scoped operation and receive a trusted context. It should not become a new database transaction framework or a second TenantEngine.

## 2. Aggregate Interpretation

### Recommendation

Treat the batch as an **atomic application command over multiple Student/Enrollment aggregates**, not as a new long-lived domain aggregate.

Reason:

- Each student retains an independent identity and history.
- A batch needs all-or-nothing orchestration and correlation, but should not erase per-student boundaries.
- ENROLL-CONTRACT-002 already defines the source/destination Enrollment effects.
- A separate long-lived `batch_transfer` domain entity would require a new business lifecycle and schema decision.

**Decision required:** owner/CTO must approve this interpretation or explicitly choose a batch aggregate.

## 3. Canonical Flow

```text
Trusted authentication
  ↓
Trusted authorization
  ↓
Trusted tenant/school/branch context
  ↓
Validate batch command + idempotency key
  ↓
Load and lock/validate every selected student and Enrollment
  ↓
Validate every business rule before mutation
  ↓
One request-scoped Unit of Work
  ├─ apply every placement edit OR transfer effect
  ├─ write domain history
  ├─ write audit records
  └─ enqueue outbox records
  ↓
Commit once
  ↓
Return the actual committed result
```

Any failure before commit must produce rollback and no success response.

## 4. Transaction Composition

The future service must join one approved transaction boundary. It must not call a per-student public method that opens another UnitOfWork inside the batch. The existing `UnitOfWork` nested-transaction prohibition is a safety signal and must not be bypassed.

If the current transaction API cannot expose a safe join/operation primitive, the implementation must stop and receive a separate transaction-architecture mission. It must not change the shared UnitOfWork as an incidental fix.

## 5. Legacy Disposition

| Path | Disposition |
|---|---|
| `StudentAffairsPortal.handleBatchTransfer` | Adapter/UI caller only after contract approval; not a source of business semantics |
| `components/student-affairs/repository/StudentRepository.transferStudent` | Single-student transport method; not batch canonical |
| `src/database/repositories/StudentRepository.bulkTransfer` | Legacy loop; do not promote without contract |
| `POST /api/students/:id/transfer` | Existing single-student route; retain only if its contract remains valid |
| `POST /api/students/bulk` | Not approved as Batch Transfer; nested transaction conflict must be resolved by a separate decision |
| `StudentEnrollmentService.transferStudent` | Existing single-student rule source; reuse only through an approved transaction-aware composition |

## 6. Scope Rules

- Same-Enrollment class/section/stage operation must be explicitly classified as placement edit.
- Branch/school/year/term ownership change is first-class Enrollment Transfer under ENROLL-CONTRACT-002.
- A batch cannot mix command types.
- Destination scope is validated from trusted server context and approved business policy.
- Cross-tenant transfers are rejected.
- No client-selected tenant, school, branch, academic year or term becomes authoritative.

## 7. Integration Boundary

For first-class Enrollment Transfer, the application contract must preserve the ENROLL-CONTRACT-002 chain:

`source close + destination create + transfer record + history + audit + outbox`

All are one Unit of Work. Student Affairs must communicate with Academic Status and downstream consumers through approved contracts, not direct UI-local state.

## 8. Architecture Risks

- Reusing single-student methods without transaction composition recreates partial writes.
- Treating class/section placement as Enrollment Transfer can create incorrect history and academic events.
- Changing shared UnitOfWork for this use case can regress unrelated modules.
- Adding an API before business decisions are approved creates a second competing canonical path.

## Decision

**RECOMMENDATION READY — OWNER/CTO DECISION REQUIRED BEFORE IMPLEMENTATION.**
