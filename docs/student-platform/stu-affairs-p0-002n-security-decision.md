# STU-AFFAIRS-P0-002N — Security Decision Package

## Mission status

**APPROVED — DESIGN/DECISION ONLY**

This package closes the security decisions that block the future `TransferOperation` schema. It does not create a table, migration, RLS policy, permission, function, or database object.

`PLATFORM-EVIDENCE-002` remains **CLOSED — BLOCKED + RCA**. Nothing in this document certifies live RLS, live database isolation, or Production.

## Decision summary

| Decision | Approved design position | Current evidence | Gate before schema |
|---|---|---|---|
| Identity source | Supabase Auth verification, then server-derived identity from server-controlled `app_metadata`; database authorization is additionally checked against the trusted application tables | `verifyTrustedSession()` calls Supabase Auth and `extractTrustedIdentity()` reads `app_metadata`; `user_metadata` is not used for security claims | Prove the deployed token and role path in Staging |
| Canonical database role | A dedicated non-owner, non-`BYPASSRLS` application role such as `edupro_staging_app` | The RLS contract targets `edupro_staging_app`, but the recorded Render path used a `postgres.<project-ref>` pooler identity and did not prove a role switch | Block schema until the actual application role is proven |
| Context propagation | Auth → server trusted `TenantContext` → one request-scoped PostgreSQL transaction; context is transaction-local | `UnitOfWork` passes trusted context to `PostgresTransactionDriver`; the driver uses parameterized `set_config(..., true)` after `BEGIN` | Prove the connection role and hostile isolation matrix |
| Tenant authority | `tenantId`, `schoolId`, `branchId`, actor, and academic-year scope are derived from the verified identity and validated server context; request values are only target assertions | Authentication rejects a mismatching school target; tenant middleware resolves and validates the server context | No client value may be used as an authority or written directly into policy context |
| Fail-closed | Missing, malformed, expired, mismatched, or unverifiable identity/context denies the operation | Missing bearer token, invalid Auth user, invalid school/role, invalid tenant, and invalid request target already have denial paths | Add the new table to the same deny matrix only in a later approved security migration |
| `FORCE ROW LEVEL SECURITY` | Required as a defense-in-depth gate for `TransferOperation` unless Security proves that every possible owner/BYPASSRLS path is permanently excluded | Current DB-SEC-004 evidence did not establish the deployed application role path | Security must decide and prove this before migration |
| Purge | Never available to the ordinary application role; separate Operations-controlled process with legal-hold and audit checks | No TransferOperation table or purge path exists | Operations/Product must approve authority and retention first |

## Trusted identity chain

1. Supabase Auth verifies the bearer token through `getUser(token)`.
2. The server rejects disabled users and identities without a valid school or recognized role.
3. Security claims are taken from server-controlled `app_metadata`; editable `user_metadata` is not an authority source.
4. The Tenant Engine validates school, branch, and academic-year scope against the trusted identity and database snapshot.
5. Authorization resolves effective database assignments using the verified user and trusted tenant scope.
6. The operation opens one request-scoped transaction and propagates only the validated context with transaction-local settings.
7. The future RLS contract evaluates the database row against that trusted context and denies when any required value is absent or inconsistent.

The client may submit a requested target for comparison, but it cannot select the effective tenant, school, branch, actor, or purge authority.

## Client-controlled claims and spoofing resistance

- `x-tenant-id`, `x-school-id`, query values, and body values are never authority for the effective context.
- A supplied school target that differs from the verified identity is rejected and audited.
- The canonical transfer contract must reject a tenant, school, branch, actor, or result reference that is not derived from the trusted context and validated against the source/destination records.
- `stageId` remains excluded because no authoritative mapping exists.
- No request may supply or override `created_by`, `requested_by`, claim actor, reconcile actor, tenant context, or purge actor.

## Pooling and session-leakage decision

The current driver begins a transaction before applying context and uses `set_config(..., true)`, whose third argument makes the setting transaction-local. `UnitOfWork` commits or rolls back and releases the connection; an active transaction is rolled back before release. This is the correct shape for isolation.

It is not sufficient evidence by itself. The current recorded Staging reconciliation identified an unresolved role-path mismatch. Before schema work, Security/Operations must prove on the real application connection that:

- two concurrent requests receive isolated contexts;
- context is absent after COMMIT and ROLLBACK;
- a failed request cannot leave context on a reused connection;
- the application cannot connect as an owner or `BYPASSRLS` role;
- no public endpoint can execute arbitrary `SET`, `set_config`, `SET ROLE`, or equivalent context mutation.

## Minimum role boundary

The ordinary application role may receive only the least-privilege DML required by the approved operation and its RLS policies. It must not receive:

- ownership of `TransferOperation`;
- `BYPASSRLS`, superuser, database-creation, role-creation, replication, or unrestricted schema privileges;
- direct DELETE for normal request processing;
- purge authority;
- permission to alter policies, tables, migrations, or security functions.

Claim and reconciliation are application-service operations, not client-selected database verbs. Purge is a separate controlled operation and is not part of the ordinary transfer service.

## Decisions still owned outside this mission

The following are explicit gates, not implementation gaps to be guessed by the engineer:

- final proof of the actual Render connection role;
- whether the final migration mandates `FORCE RLS`;
- the approved role/connection deployment model;
- the authorized claim and reconciliation operators;
- retention, legal hold, and purge authority.

Until these are approved and evidenced, the result is **STOP + SECURITY DECISION REQUIRED** and no migration is authorized.
