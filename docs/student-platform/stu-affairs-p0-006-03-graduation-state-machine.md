# STU-AFFAIRS-P0-006-03 — Graduation State Machine

Status: `UNDECIDED — OWNER APPROVAL REQUIRED`

This is a proposed safety model for review. It is not an implementation instruction and must not be treated as an approved lifecycle migration.

## Proposed states

| State | Meaning | Durable evidence required |
|---|---|---|
| `ELIGIBILITY_PENDING` | Inputs are being collected and validated | Student, enrollment, academic context, results references |
| `ELIGIBLE` | Rules have evaluated successfully | Versioned eligibility decision and calculation evidence |
| `APPROVAL_PENDING` | Required authority has not completed approval | Approval request, actor, reason, expiry policy |
| `APPROVED` | Graduation decision is approved but transaction finalization is pending | Approved decision and concurrency token |
| `GRADUATED` | Canonical graduation record committed | Graduation record, closed enrollment, academic status, history, audit |
| `CERTIFICATE_PENDING` | Graduation is committed; certificate artifact is not complete | Linked graduation record and artifact job state |
| `CERTIFICATE_ISSUED` | Certificate artifact has been issued and linked | Immutable artifact reference and issuance evidence |
| `REJECTED` | Eligibility or approval rejected | Reason, actor, and immutable decision history |
| `CORRECTION_PENDING` | Approved correction workflow is open | Original record, correction reason, approval reference |
| `REVOKED` | Graduation was revoked through approved exceptional workflow | Revocation authority, reason, linked correction history |

These states remain `UNDECIDED` until Academic Affairs, Domain, Schema, Security, and Operations owners approve them.

## Allowed transitions for review

| From | To | Required gate |
|---|---|---|
| `ELIGIBILITY_PENDING` | `ELIGIBLE` | All authoritative inputs validate |
| `ELIGIBILITY_PENDING` | `REJECTED` | Explicit reason and trusted actor |
| `ELIGIBLE` | `APPROVAL_PENDING` | Required evidence complete |
| `APPROVAL_PENDING` | `APPROVED` | Authorized approver and current version |
| `APPROVAL_PENDING` | `REJECTED` | Authorized decision and reason |
| `APPROVED` | `GRADUATED` | One atomic, idempotent commit |
| `GRADUATED` | `CERTIFICATE_PENDING` | Certificate workflow accepted |
| `CERTIFICATE_PENDING` | `CERTIFICATE_ISSUED` | Artifact persisted and linked |
| `GRADUATED` | `CORRECTION_PENDING` | Explicit correction authority |
| `CERTIFICATE_ISSUED` | `CORRECTION_PENDING` | Exceptional correction authority |
| `CORRECTION_PENDING` | `GRADUATED` | Approved correction committed as new history |
| `CORRECTION_PENDING` | `REVOKED` | Approved revocation committed as new history |

## Forbidden transitions

- Any client-driven jump directly to `GRADUATED` or `CERTIFICATE_ISSUED`.
- `ELIGIBLE` without validated results and academic context.
- `APPROVED` without an authorized approval record.
- `GRADUATED` without closing the applicable active Enrollment according to the approved contract.
- Any update that overwrites an approved record in place.
- Any physical delete of an approved graduation or its history.
- Any restoration that silently changes an approved graduation state.
- Any retry that creates a second graduation for the same idempotency key/context.

## Terminal and exceptional behavior

`CERTIFICATE_ISSUED`, `REVOKED`, and finalized historical records are terminal for ordinary updates. Only a separately approved correction workflow may create a new linked event. The original evidence remains retained and immutable.

## Transaction boundary

The `APPROVED → GRADUATED` transition must be one request-scoped Unit of Work covering:

1. revalidation of tenant, student, enrollment, academic context, results, and expected version;
2. canonical graduation record;
3. Enrollment closure;
4. Academic Status update and compatibility projection, if still required;
5. immutable history;
6. audit event;
7. outbox event.

Any failure rolls back the complete operation. No success response is allowed before commit.

## Decision

`STOP — STATE MACHINE REQUIRES DOMAIN/ACADEMIC OWNER APPROVAL`
