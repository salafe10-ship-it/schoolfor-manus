# STU-AFFAIRS-P0-002D — Transaction Analysis

## Current Transaction Flow

```text
StudentAffairsPortal
  -> one REST call per student
  -> StudentEnrollmentService.transferStudent
  -> UnitOfWork per student
  -> StudentRepository.update direct Supabase/fallback write
  -> AuditRepository legacy write
```

This is not one batch transaction.

## Required Canonical Flow

```text
canonical batch application service
  -> preflight all items
  -> one UnitOfWork.runInTransaction
       -> transaction-aware Student/Enrollment repository operations
       -> domain history repository operations
       -> audit repository operation
       -> outbox repository operation
  -> one commit or rollback
```

## Session Propagation Finding

The transaction contract is technically passable through `TransactionSession`, as demonstrated by Registration and Documents repositories. The transfer repositories do not accept that session and do not use `UnitOfWork.getActiveContext()?.databaseTransaction`.

Adding session propagation to the legacy student repository would be an architectural repository contract change, not a safe local handler fix. It requires an explicit mission with compatibility and regression scope.

## Shared UnitOfWork Boundary

The shared UnitOfWork correctly rejects nested transactions. This protects the system from accidentally treating nested scopes as atomic. It also means the current generic bulk route cannot be used as a batch transfer path.

The safe rule is:

```text
one batch request -> one UoW -> one TransactionSession -> one commit/rollback
```

## Audit/History/Outbox

The current transfer path has no evidence of writing Enrollment history and outbox records through the same session. A future implementation must not call a legacy audit function that commits outside the transaction.

## Architecture Dependency

**ARCHITECTURE MISSION REQUIRED:** define a transfer-aware repository/application composition. If that mission concludes that the shared UnitOfWork must change, it must be a separate transaction-infrastructure mission.

## Decision

**Current path cannot meet atomicity without a prohibited or unapproved change. STOP + RCA.**
