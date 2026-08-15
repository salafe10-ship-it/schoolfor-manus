# STU-AFFAIRS-P0-002I — Canonical Mapping Contract Target

## Required future command inputs

- source Enrollment ID;
- destination school/branch/year/term request, subject to trusted server validation;
- placement values only for a Placement Edit;
- effective date and transfer reason;
- expected source Enrollment version;
- batch operation/idempotency key;
- request and correlation IDs from trusted request context.

## Server-owned resolution

The server must resolve tenant, actor, accessible scope, current Enrollment, source school/branch/year/term, and final destination validity. Client-supplied `schoolId`, `tenantId`, `branchId`, role, or actor values must never select identity or override scope.

## Classification rules

1. class/section change inside the same Enrollment → Placement Edit.
2. branch/school/academic-year/term change → First-class Enrollment Transfer, only when the approved scope policy allows it.
3. stage change → unresolved domain mapping; no mutation until the owner defines its canonical owner.
4. missing source/destination academic context → reject before transaction.

## Required dependencies

- owner-approved scope matrix from P0-002H;
- canonical source/destination Enrollment mapping;
- explicit owner decision for `stageId`;
- approved API command contract;
- durable idempotency strategy.

## Forbidden shortcuts

- infer Enrollment by the first student row;
- copy legacy display text into IDs;
- treat school as tenant;
- accept destination scope from the browser as trusted;
- translate `stageId` to academic year, term, or class without an approved reference relation.
