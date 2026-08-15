# STU-AFFAIRS-P1-006-20 — Legacy Writer Map

## Legacy writers found

### `StudentLifecycleManager`

Located at `src/database/services/StudentLifecycleManager.ts`. It allows vocabulary including `accepted`, `enrolled`, `re_enrolled`, `dismissed`, `inactive`, and `on_leave`, which differs from the approved academic lifecycle vocabulary. It is called by legacy services and is not a canonical history writer.

### `StudentAdmissionDomainService`

Located at `src/modules/domain-services/StudentAdmissionDomainService.ts`. It contains direct `students` update commands for registration, promotion, transfer, and graduation. Repository search found test usage but no production route import. It remains a source-level legacy writer and must not be removed without an explicit dead-code decision.

### `StudentLifecycleService`

Located at `src/modules/student-admission/application/StudentLifecycleService.ts`. It calls the legacy `StudentRepository.updateStatus`, uses a hardcoded loopback IP in audit metadata, and has no production route/import proven by repository search. It remains an unproven-reachability writer.

### `StudentService` legacy delegates

`StudentService` remains reachable from promotion, re-enrollment, dismissal, archive, and bulk routes. These delegates use `StudentRepository.update` and `AuditRepository.log`, not the canonical Student Academic Status writer.

## Important safety conclusion

The inventory identifies legacy writers but does not delete, disable, or reroute them. Any consolidation requires an owner/domain decision covering status vocabulary, Enrollment closure, history ownership, authorization, idempotency, and audit/outbox semantics.
