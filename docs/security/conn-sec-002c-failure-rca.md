# CONN-SEC-002C — Live Staging Certification Failure RCA

Date: 2026-08-10

## Decision

**BLOCKED — NOT CERTIFIED**

The Staging deployment is healthy and the temporary diagnostic identity authenticated with Supabase Auth, but the application cannot retain the session long enough to call the protected diagnostic endpoint.

## Evidence

1. Render Staging is Live on commit `a74d7c6` from branch `codex/sop-001-staging`.
2. The Staging feature flags are present: `EDUPRO_ENVIRONMENT=staging` and `CONN_DIAGNOSTIC_ENABLED=true`.
3. The temporary Auth user reached Supabase Auth successfully; Supabase recorded a successful sign-in.
4. The temporary identity used a real Staging school UUID and branch UUID in trusted `app_metadata`.
5. The backend login path validates the school successfully, then the frontend calls `applyTrustedSessionUser()`.
6. `applyTrustedSessionUser()` resolves the trusted school only from the local `saasSchools` seed collection. That collection uses legacy identifiers such as `school_1`; it does not contain the real Staging school UUID.
7. The frontend therefore throws `Invalid trusted session identity`, logs out, and returns to the login screen.
8. The temporary Auth user and its exact application fixture rows were deleted after the attempt.

## Root cause

The deployed application has two incompatible school identity representations:

- Supabase/Auth and the platform database use UUID school identifiers.
- The frontend session application layer still resolves schools from local demo identifiers.

This prevents an authenticated real Staging identity from being retained by the application. It is an end-to-end session integration defect, not evidence that the PostgreSQL connection role is correct or incorrect.

## Security impact

The failure is fail-closed: the client does not enter a protected portal with an unmapped identity. However, the live connection identity, RLS, AUTH-004, and SOP-001 certification gates cannot be executed through the approved application path.

## Scope boundary

No Production service, Production database, RLS policy, migration, grant, database role, or connection secret was modified.

## Required next action

CTO approval is required for a narrowly scoped identity-mapping remediation. The remediation must make the trusted school UUID resolvable by the application without restoring any client-selected school, role, or tenant trust. After deployment, rerun CONN-SEC-002C before any RLS or SOP-001 certification.

## Temporary fixture cleanup

- Auth user: removed through the Supabase Staging Auth UI.
- Application rows: removed by exact primary-key deletes in one Staging transaction.
- No existing tenant, school, branch, role, or permission rows were modified.
