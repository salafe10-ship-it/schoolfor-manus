# STU-AFFAIRS-P1-003-05A — Canonical Student Import Contract

## Contract status

Design only. This document does not authorize implementation, schema work, migration, SQL, RLS, or production execution.

## Operation identity

The only operation defined by this contract is `student_import`.

The request must contain:

- `Idempotency-Key` header: required, opaque, 1–200 characters;
- JSON envelope: `{ "operation": "student_import", "items": [...] }`;
- `items`: 1–100 records.

The server may generate a `batchId`, `requestId`, and `correlationId`. The client must never supply or control `tenantId`, `schoolId`, `branchId`, `academicYear`, `actorId`, role, audit actor, or server timestamps. If a body carries any of those fields, the server rejects the request rather than treating them as trusted context.

If an optional body `operationKey` is introduced later, it must equal the `Idempotency-Key` header. The header remains the canonical key.

## Student import item

### Required fields

- `legalFirstName`: non-empty text;
- `legalLastName`: non-empty text;
- `dateOfBirth`: valid `YYYY-MM-DD` calendar date;
- `termId`: UUID/reference resolved inside the trusted school and academic year;
- `guardian`: object with a valid guardian relationship contract.

### Optional fields

- `studentNumber`: canonical uppercase number format; automatic numbering is used when absent;
- `legalMiddleName`;
- `preferredName`;
- `gender`;
- `nationality`;
- `birthCountryCode`;
- `admissionReference`;
- guardian name, phone, email, address, relationship, custody, consent, and contact flags.

### Import restrictions

- `duplicateOverride` is not allowed in the first import contract; duplicate exceptions require a separate approved operation.
- A client cannot provide `guardian.id` to link an arbitrary existing guardian. The server may resolve a unique existing guardian through the approved matching policy; ambiguous matches fail the batch.
- Manual `studentNumber` requires the dedicated number-override permission; otherwise it is rejected.
- Unknown fields are rejected or explicitly ignored by a versioned allow-list; they must never become persistence fields implicitly.

## Validation order

1. Authenticate the request.
2. Resolve and validate trusted TenantContext.
3. Check dedicated import permission plus any number-override permission.
4. Validate envelope, item count, field types, formats, and allowed enums.
5. Resolve term and academic references inside trusted scope.
6. Run deterministic duplicate and student-number preflight.
7. Calculate the canonical payload hash.
8. Execute the single atomic import transaction.
9. Return the committed result or a structured failure.

## Failure policy

`ALL_OR_NOTHING` is mandatory. One invalid row, duplicate conflict, guardian ambiguity, reference failure, or persistence failure rolls back every student and guardian write in the batch. The response includes the failing item indexes and safe validation codes, but never claims partial success.

The initial maximum is 100 items. Larger files must be split by the caller into separately approved operations; the server must not silently truncate or process an unbounded request.

## Response contract

Successful first execution:

```json
{
  "success": true,
  "data": {
    "batchId": "server-generated",
    "status": "completed",
    "processedCount": 2,
    "results": [{ "index": 0, "studentId": "server-generated" }]
  },
  "meta": { "idempotentReplay": false, "requestId": "server-generated", "correlationId": "server-generated" }
}
```

An exact retry returns the stored result with `idempotentReplay: true`. Validation failures use 400, authorization failures 403, duplicate/idempotency conflicts 409, and unexpected persistence failures 500 with no internal database detail.

## Explicit exclusions

This contract does not define generic bulk update/delete/archive/promote, Batch Transfer, Finance, RLS, migrations, or a new database table. Those require separate approved contracts.

