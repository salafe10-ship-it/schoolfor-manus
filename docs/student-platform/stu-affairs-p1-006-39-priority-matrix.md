# STU-AFFAIRS-P1-006-39 — Priority Matrix

| Finding | Severity | Area | Evidence | User impact | Security/data impact | Fix scope | Approval/dependency | Recommended disposition |
|---|---|---|---|---|---|---|---|---|
| SA-P1-006-39-01 | P1 | Student Timeline | `server.ts:1312-1321`; legacy `AuditRepository` reads `audit_logs`; canonical Student writes use `audit_events` | Successful Student operations may not appear in the timeline | Traceability incompleteness; no direct cross-tenant disclosure proven | Bounded reader and tests | Canonical audit projection; security/owner review recommended | Issue `STU-AFFAIRS-P1-006-40` |
| SA-P2-006-39-01 | P2 | Reporting/Print | `StudentAffairsPortal.tsx:625-692` prints current client page | Official-looking print may omit filtered rows outside the current page | No mutation; report privacy/permission review still needed | Bounded server-authoritative print contract | Product/Operations decision on report semantics | Defer after P1 |

## Ordering rationale

1. Fix the Student Timeline source mismatch first because it affects operational trust in successful Student actions and audit traceability.
2. Address print semantics second because it is a reporting completeness issue, not a proven data-security failure.
3. Do not reopen closed profile, lifecycle, ISO, canonical read, or bulk findings in this order.

## Gate status

- P0 false success, unauthorized action, cross-tenant disclosure, and data-corruption findings: **none proven in this discovery pass**.
- P1 next bounded fix: **identified**.
- Owner-dependent ISO/birth-country work: **remains blocked separately** and is not part of this inventory.
