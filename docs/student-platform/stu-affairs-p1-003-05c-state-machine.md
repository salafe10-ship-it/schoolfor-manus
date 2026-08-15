# STU-AFFAIRS-P1-003-05C — Student Import State Machine

## State Machine

```text
PENDING
   |
   | atomic trusted claim
   v
PROCESSING
   |----------------------------|
   |                            |
   | transaction commits        | definitive pre-commit failure
   v                            v
COMMITTED                    FAILED
   ^
   | authorized reconciliation proves commit
   |
RECONCILE_REQUIRED
   |
   | authorized reconciliation proves no commit
   v
FAILED
```

`PROCESSING` may enter `RECONCILE_REQUIRED` when ownership expires or the process terminates before the system can prove whether the database transaction committed. It must not silently return to `PENDING` and must not be blindly rerun.

## Transition Guards

### PENDING → PROCESSING

Required:

- authenticated session;
- trusted TenantContext;
- `Student.Import` authorization;
- valid operation namespace and key;
- payload hash match for any existing record;
- one successful durable claim under the tenant/key uniqueness rule;
- a server-owned processing lease.

### PROCESSING → COMMITTED

Required:

- all input rows validated before mutation;
- duplicate and academic reference checks pass;
- all Student, Guardian, relationship, audit, and success outbox writes use the same transaction;
- transaction commits successfully;
- complete replayable result is durably stored or durably referenced;
- command status and completion metadata are committed consistently.

### PROCESSING → FAILED

Allowed only when the system can prove that no business mutation committed. The failure result must be durable, tenant-scoped, and safe to replay.

### PROCESSING → RECONCILE_REQUIRED

Required when the command owner disappears, the lease expires, or the response/transaction outcome cannot be proven. This state protects against duplicate student creation.

### RECONCILE_REQUIRED → COMMITTED / FAILED

Only an authorized reconciliation process may close this state. It must inspect durable business evidence and the command/audit records without re-executing the import.

## Idempotency Outcomes

| Request | Required result |
|---|---|
| Same tenant + namespace + key + same hash, COMMITTED | Return the original result; never execute again |
| Same tenant + namespace + key + same hash, FAILED | Return the original definitive failure; never execute again |
| Same key + different hash | `409 Conflict`; never execute |
| Same key while PROCESSING with live lease | Return an in-progress response or approved bounded wait; never create a second claimant |
| Same key while RECONCILE_REQUIRED | Return reconciliation-required; never blind retry |
| New key with duplicate student data | Run canonical duplicate detection; idempotency does not bypass business rules |

## Security Invariant

The state machine is controlled only by trusted server context and durable database rules. The browser cannot choose the tenant, actor, state, owner, result, hash, or transition.

