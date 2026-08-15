# STU-AFFAIRS-P0-006-14 — Security Hardening Implementation Readiness Reconciliation

Status: `RECONCILIATION COMPLETE — SECURITY APPROVAL REQUIRED`

## Mission boundary

This is a static reconciliation of the approved/previous Student Affairs authorization workstreams P0-006-07 through P0-006-13. No application code, database, RLS, migration, staging environment, production environment, or Bulk request was modified or executed.

## Evidence set

| Workstream | Evidence located | Current conclusion |
|---|---|---|
| P0-006-07 authorization contract | Permission contract, approval matrix, decision package, validation | Contract is defined but owner/security approval is not evidenced in the repository |
| P0-006-08 authorization feasibility | Feasibility, enforcement map, validation | Enforcement path exists; object/scope-aware authorization is not proven |
| P0-006-09 hardening design | Scope model, cache analysis, sensitive-operation matrix, design | Design is complete; security approval is required |
| P0-006-10 cache/wildcard decision | Cache decision, failure matrix, wildcard decision, validation | Role-only cache is rejected for scope-sensitive use; wildcard and cache policy remain undecided |
| P0-006-11 readiness | Readiness, threat map, change map, validation | Isolatable implementation package identified; approval dependencies remain open |
| P0-006-12 security approval gate | No separate repository artifact found | Approval cannot be inferred; gate remains open |
| P0-006-13 Bulk audit | Authorization audit, scope matrix, feasibility, validation | No direct cross-school/auth-denied bypass proven; branch/year, operation, transaction, fallback, and audit gaps are proven risks |

## Final reconciliation

| Area | Current state | Required change | Security approval | Implementation ready |
|---|---|---|---|---|
| Permission cache | Role-based cache risk; middleware clears per request but direct consumers remain relevant | Scoped identity/tenant/school/branch/revision key, bounded TTL, fail-closed, invalidation ownership | Required | No |
| Wildcard roles | Static wildcard definitions and database assignments have different behavior | Select authoritative source; prohibit normal production wildcard or define bounded break-glass policy | Required | No |
| Lifecycle permissions | Broad `Student.Write` protects multiple operations | Approve operation-specific capability names and role assignments | Required | No |
| Bulk permission | One broad `Student.Write` covers six operation values | Approve separate bulk capability plus operation capability and per-item decision | Required | No |
| Trusted TenantContext | Request boundary validates context, but Bulk service receives only school ID | Carry trusted context into service/repository contract and reject incomplete context | Required | No |
| Per-item scope | School scope is present in observed update path; branch/year are not consistently carried | Enforce per-item tenant/school/branch/year ownership before every mutation | Required | No |
| Branch scope | Repository predicates omit branch; transfer accepts branch for privileged roles without target proof | Define and enforce branch ownership and target-branch authorization | Required | No |
| Academic-year scope | Bulk service does not consistently carry year; promotion hardcodes a year | Define trusted year source and operation policy | Required | No |
| Maker/checker | Not proven in the centralized authorization path | Approve which sensitive operations require independent approval and how it is recorded | Required | No |
| Denial audit | Central denial hook is proven; item-level scope/operation metadata is incomplete | Verify coverage and add only approved metadata | Required | Partial |
| Transaction/persistence | Nested UnitOfWork risk and direct/fallback writers are proven | Define one canonical request-scoped transaction writer and fail closed on persistence failure | Security + Operations | No |
| Idempotency/history/outbox | Not proven for Bulk lifecycle branches | Approve replay and downstream consistency contract | Domain + Operations | No |

## Safe facts

- Authentication derives the actor from the trusted session.
- The observed Bulk route performs centralized permission middleware before the handler and invokes tenant validation indirectly through that wrapper.
- The observed route takes school identity from the authenticated request, not from the request body.
- Unknown Bulk operation values are rejected before item processing by P1-006-26.
- No static path was found where a denied authorization request reaches the observed handler.
- No executed cross-tenant, cross-school, cross-branch, or Bulk mutation was performed.

## Blocking facts

- Branch containment is not proven safe.
- Academic-year containment is not proven safe.
- Operation-specific and per-item authorization is not centralized.
- The role-only cache and wildcard policy are not approved for production scope-sensitive use.
- Legacy persistence can bypass the active transaction or fall back to local storage after a database error.

## Decision

`P0-006-14 = SECURITY HARDENING IMPLEMENTATION BOUNDARY READY — SECURITY APPROVAL REQUIRED`

This reconciliation does not authorize implementation. The next safe step is a narrowly scoped Security/Operations approval naming the allowed files, permission policy, cache policy, wildcard policy, and test evidence required for the first hardening slice.
