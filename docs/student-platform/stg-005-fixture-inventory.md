# STG-005 — Synthetic Fixture Inventory

## Environment

- Staging Supabase project: `edupro-school-erp-staging`
- Staging Render service: `edupro-school-erp-staging`
- Fixture namespace: `STG-005`
- Production: untouched

## Created temporarily

The following synthetic records were created inside one controlled Staging fixture operation:

- one tenant;
- one school;
- one branch;
- one active academic year;
- one active term;
- one Supabase Auth user with trusted `app_metadata` claims;
- one active application user linked to the Auth user;
- one school-admin role;
- four SOP-001 permissions;
- four role-permission assignments;
- one user-role assignment.

No real personal data was used. Credentials and tokens are intentionally excluded from this document.

## Cleanup verification

Cleanup completed successfully after the blocked E2E request. The synthetic Auth user and all synthetic public records were deleted. Post-cleanup verification returned zero matching fixture records for the Auth user, tenant, school, branch, academic year, term, application user, role, permissions, role assignments, and user-role assignment.

## Business data verification

No synthetic student, guardian, enrollment, academic-status, audit, or outbox records remained. The business tables were verified at zero rows for the temporary tenant.

