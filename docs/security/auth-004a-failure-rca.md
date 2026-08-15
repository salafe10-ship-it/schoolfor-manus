# AUTH-004A — Failure RCA and Release Gate

## Status

**BLOCKED — RLS release gate**

## Root Cause 1: Database RLS posture

Read-only inspection of the Staging project showed `relrowsecurity = false` for the inspected `public` platform, identity, academic-context, and student-document tables. The application role `edupro_staging_app` is not a RLS bypass role (`rolbypassrls = false`), but that does not compensate for tables with RLS disabled.

This is a critical release blocker for a mission whose acceptance criteria require database-level isolation. AUTH-004A explicitly forbids implementing or changing RLS, so the correct action is to stop certification rather than alter the database under this mission.

## Root Cause 2: Synthetic role-key compatibility

The preferred synthetic role key `doc_certifier_test` is not present in the application’s static role registry accepted by the current fail-closed resolver. The live fixture therefore used the existing resolver-compatible key `accountant`, while retaining an explicit AUTH-004A display name. This was temporary test data only and was fully removed. It exposes a contract debt between the database role catalog and the application role registry; it was not repaired in this mission.

## Remediation Boundaries

1. Approve a separate database-security mission to add and verify trusted JWT-based RLS policies.
2. Approve a separate authorization-contract decision for synthetic/non-production role keys, or register a dedicated test role through the approved registry process.
3. Re-run the complete AUTH-004A matrix after RLS is enabled, including cross-tenant read/update/delete attempts and missing-tenant behavior.

## Safety Record

No source code or schema was modified. No Production resource was touched. Synthetic Auth and database fixture rows were deleted and verified absent. No secret, password, token, database URL, or service-role value is recorded here.

