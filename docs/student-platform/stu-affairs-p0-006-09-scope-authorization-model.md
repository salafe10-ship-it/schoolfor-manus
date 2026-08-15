# STU-AFFAIRS-P0-006-09 — Scope Authorization Model

Status: `PROPOSED — SECURITY/OWNER APPROVAL REQUIRED`

## Decision flow

1. Authenticate the session and obtain trusted identity.
2. Resolve tenant, school, branch, and academic context from trusted identity and server validation.
3. Normalize the requested permission.
4. Evaluate the operation-specific permission and approval requirement.
5. Load the target object using trusted scope predicates.
6. Evaluate object and business policy.
7. Allow only if every gate passes; otherwise deny and audit.

## Scope rules

| Resource | Minimum trusted scope |
|---|---|
| Student | tenant + school + branch policy |
| Guardian link/update | tenant + school + branch + student relationship |
| Timeline | tenant + school + branch + student |
| Document | tenant + school + branch + student + document |
| Enrollment | tenant + school + branch + student + academic year + term |
| Transfer | source and destination tenant/school/branch plus approved operation |
| Bulk operation | envelope scope plus per-item target scope |

## Placement of checks

The recommended model is layered, not duplicated:

- middleware: authentication and coarse permission;
- tenant engine: trusted context and request-target validation;
- shared authorization policy: operation and object scope decision;
- domain service: business and approval invariants;
- repository: mandatory SQL/query scope predicates.

No layer may treat another layer's existence as proof that its own required invariant was satisfied.

## Missing policy decisions

- branch optionality by operation;
- cross-branch access for administrators;
- cross-school transfer authority;
- parent/student self-scope, if applicable;
- maker/checker roles and separation;
- academic context requirement per lifecycle operation.

All remain `OWNER DECISION REQUIRED`.
