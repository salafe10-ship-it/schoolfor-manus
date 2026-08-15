# STU-AFFAIRS-P1-006-11 — Lifecycle Dependency Map

## Current route-to-service graph

```text
Authenticated request
  ↓
Permission + trusted tenant middleware
  ↓
server.ts lifecycle route
  ↓
StudentService facade
  ├─ StudentEnrollmentService
  │    ├─ reEnrollStudent
  │    ├─ transferStudent
  │    ├─ dismissStudent
  │    └─ archiveStudent
  ├─ StudentPromotionService
  ├─ StudentGraduationService
  └─ StudentWithdrawalService (delete/restore path)
       ↓
UnitOfWork transaction
       ↓
StudentRepository + AuditRepository + selected enlist operations
```

## Required canonical target (not implemented by this audit)

```text
Authenticated request
  ↓
Authorization
  ↓
Trusted Tenant Context
  ↓
Lifecycle/Enrollment command
  ↓
Canonical Student + Enrollment + Academic Status aggregates
  ↓
One transaction boundary
  ├─ current state
  ├─ immutable status/enrollment history
  ├─ approved transition record
  ├─ audit event
  └─ outbox event
```

## Dependency risks

| Dependency | Current evidence | Classification |
|---|---|---|
| Approved Academic Status vocabulary | Legacy manager lacks `admitted` and includes extra aliases | BLOCKED |
| Enrollment aggregate/history | No dedicated enrollment/history write in reviewed actions | NOT_IMPLEMENTED / DEPENDENCY |
| Transfer aggregate/history | Movement object returned only; target school not applied | BLOCKED |
| Academic year/term context | Missing from promote/re-enroll/transfer command contracts | CONTRACT GAP |
| Durable graduation record | Mock registry object returned by service | NOT_IMPLEMENTED |
| Audit | `AuditRepository.log` used in reviewed services | CANONICAL HOOK / not full history |
| Outbox | No explicit domain outbox call in reviewed services | NOT_OBSERVABLE / NOT_PROVEN |
| Restore | Two service/route paths | DUPLICATE |
| Physical delete | Canonical server route rejects permanent action; browser adapter still exposes method | BLOCKED / LEGACY SURFACE |
| Financial promotion carry-over | Invoice enlistment appears inside promotion transaction but financial owner contract is not certified here | REQUIRES-OWNER-DECISION |

## Boundary rule

No lifecycle correction should be applied by changing only the UI. A correction involving status vocabulary, enrollment history, transfer history, graduation records, or academic-year/term context requires a separately authorized domain/database/API decision.

