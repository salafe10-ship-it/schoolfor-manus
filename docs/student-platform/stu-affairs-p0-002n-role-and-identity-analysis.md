# STU-AFFAIRS-P0-002N — Role and Identity Analysis

## Scope

Static inspection of the current repository only. No credentials, tokens, SQL Editor, database, or Production environment were accessed or changed.

## Observed chain

| Layer | Current implementation/evidence | Security interpretation |
|---|---|---|
| Auth verification | `server.ts` extracts a Bearer token and `trustedAuthentication.ts` calls Supabase `auth.getUser()` | Signature/expiry/user existence are delegated to Supabase Auth; missing or invalid sessions fail closed |
| Security claims | `extractTrustedIdentity()` reads `app_metadata.school_id`, `role`, `branch_id`, and academic-year values; comments identify `user_metadata` as editable | Tenant and role claims must remain server-managed; user-editable metadata is not authority |
| School validation | Trusted identity is checked against the trusted school presentation | A valid token without a valid school is rejected |
| Tenant validation | `tenantValidationMiddleware` resolves and validates context, then compares request targets | Request targets are assertions only; mismatches are denied and audited |
| Authorization | `RoleResolver` can load effective assignments from `users`, `user_roles`, `roles`, `role_permissions`, and `permissions` | The database assignment path is stronger than trusting a client role, but must run on the same trusted tenant context |
| Database context | `UnitOfWork` passes trusted context to `PostgresTransactionDriver`; the driver applies parameterized transaction-local settings after `BEGIN` | Correct isolation shape, but not proof of the deployed role path |
| Pool lifecycle | Commit/rollback releases the transaction session; active release rolls back | Supports request isolation; must be proven with concurrent hostile tests |
| Current RLS | DB-SEC-003 policies use `current_setting('app.*')`; no TransferOperation policy exists | Not reusable by assumption; security decision is required |
| Live role evidence | DB-SEC-004 recorded the Render path as a `postgres.<project-ref>` pooler identity and found no proven switch to `edupro_staging_app` | Application-role isolation remains blocked |

## Canonical identity decision

The canonical transfer service must receive a server-created trusted context, never a client-created context. The source of the actor is the verified Supabase user; the effective role is resolved by the approved authorization path; tenant/school/branch scope is resolved by the Tenant Engine and database relationships.

The database connection must use a dedicated non-owner, non-`BYPASSRLS` role. The current `postgres`-path evidence cannot be accepted as the final application role because an owner or bypass role can defeat the very RLS boundary being certified.

## Role responsibility matrix

| Capability | Ordinary app role | Canonical transfer service | Operations/Security control |
|---|---:|---:|---:|
| Read same-tenant operation | Yes, policy-scoped | Yes | Yes |
| Create PENDING operation | Through service path | Yes | Yes |
| Claim PROCESSING | No direct client verb | Yes | Controlled worker only |
| Commit/fail transition | No direct client verb | Yes | Controlled worker/service |
| Reconcile | No | Only when explicitly authorized | Yes, approved operator/process |
| Purge | No | No | Separate approved process only |
| Alter schema/RLS/roles | No | No | Security/DB administration only |

No new permission or role is created in this mission. The matrix is a boundary decision for the later migration and service missions.

## Fail-closed cases

The operation must deny when any of the following is true:

- bearer token missing, invalid, expired, or not revalidated;
- user disabled or identity incomplete;
- `app_metadata` lacks a valid trusted school or recognized role;
- database role is owner, `BYPASSRLS`, or otherwise unproven;
- tenant/school/branch context is missing or inconsistent;
- source/destination reference crosses the tenant boundary;
- actor is not the verified user or approved service identity;
- expected version is stale;
- retention/legal-hold decision is missing for purge.

## Open security gates

1. Prove the actual Render database role with a controlled application-role session.
2. Approve the final JWT/app_metadata-to-server-context contract.
3. Decide whether `FORCE RLS` is mandatory for the new table.
4. Approve claim/reconcile/purge role ownership without changing AuthorizationEngine in this mission.
5. Execute the hostile concurrency and connection-reuse matrix before any migration is approved.
