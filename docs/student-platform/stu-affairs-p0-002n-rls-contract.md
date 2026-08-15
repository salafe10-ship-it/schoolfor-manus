# STU-AFFAIRS-P0-002N — TransferOperation RLS Contract

## Status and boundary

This is a policy contract only. It contains no SQL and does not alter the existing RLS migration. It must not be treated as live certification.

## Effective context

The policy boundary receives a context established only after:

`Supabase Auth → TrustedIdentity → Tenant Engine → Authorization → request-scoped transaction`

The effective context contains tenant, school, optional branch, actor, and correlation/request identifiers. Values from request body, query string, headers, local storage, or client state are not authoritative.

The policy must deny if the context is missing, malformed, internally inconsistent, or cannot be tied to the authenticated actor. A target row must also be internally consistent: its tenant, school, branch, actor, enrollment, and transfer references must belong to the same authorized tenant boundary.

## Operation matrix

| Operation | Ordinary application role | Required conditions | Failure result |
|---|---|---|---|
| SELECT | Allowed only for the permitted tenant scope | Row tenant/school/branch is inside the trusted context; sensitive result references remain inside the same boundary | Deny; no cross-tenant existence signal |
| INSERT / create PENDING | Allowed only through the canonical service | Server supplies tenant, school, actor, request, correlation, and canonical hash; source/destination references are validated; client cannot set authority fields | Deny atomically |
| Claim PENDING | Allowed only to the canonical worker/service | State is PENDING, idempotency key matches the canonical request, tenant context matches, and the claim is made by an approved service identity | Deny; do not move state |
| Update PROCESSING / COMMITTED / FAILED | Not a general client update | Only the canonical service may perform the approved state transition with expected version and same tenant; immutable identity fields cannot change | Deny; preserve prior state |
| Reconcile | Separate controlled operation | State is RECONCILE_REQUIRED or otherwise eligible by approved policy; operator/service is authorized; evidence and reason are supplied by the server; tenant boundary is revalidated | Deny and create a security/audit event through the approved service path |
| DELETE / purge | Never ordinary application access | Separate Operations-controlled purge process, legal-hold check, approved retention decision, tenant-scoped batch, and append-only audit evidence | Deny; no physical deletion |

## Isolation invariants

1. Tenant A cannot read, insert, claim, update, reconcile, or purge Tenant B rows.
2. A school or branch mismatch is denied even when the user attempts to spoof a request field.
3. A missing tenant context is denied rather than interpreted as unrestricted access.
4. A forged actor, result reference, enrollment reference, or transfer reference is denied.
5. A row cannot be moved between tenants by UPDATE.
6. State transitions are service-controlled and optimistic-concurrency protected; a stale version is denied.
7. `RECONCILE_REQUIRED` is not purgeable by the normal application path.
8. Administrative SQL Editor or owner access is not evidence of application-role isolation.

## Existing RLS comparison

The existing `202608081700_db_sec_003_rls.sql` uses `current_setting('app.*')` and has no `TransferOperation` policy. Its presence cannot be copied mechanically for this entity because the current live reconciliation did not prove that the deployed connection executes as `edupro_staging_app` or that the settings cannot be influenced through an unsafe role/session path.

The future migration must therefore be preceded by a Security-approved decision on:

- JWT/app_metadata authority at the Auth boundary;
- the exact non-owner, non-`BYPASSRLS` connection role;
- whether `FORCE ROW LEVEL SECURITY` is mandatory;
- claim, reconcile, and purge role boundaries;
- hostile concurrent-connection tests.

No policy is added by this package.
