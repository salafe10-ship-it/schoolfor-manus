# AUTH-004A — Staging Fixture Report

## Scope

This report records the temporary, synthetic Staging-only fixture used for AUTH-004A. Production was not accessed or modified. No application source, migration, schema, RLS policy, permission registry, or persistent business data was changed.

## Fixture

- Tenant/school/branch: synthetic and isolated to the Staging project.
- Auth identity: synthetic email user created through the Supabase Auth dashboard.
- App identity: one matching `public.users` row linked to the Auth user.
- Role: temporary resolver-compatible role key `accountant`; display name identified it as the AUTH-004A document-certifier fixture.
- Permissions: exactly six tenant-scoped permissions:
  - `StudentDocument.View`
  - `StudentDocument.Create`
  - `StudentDocument.Verify`
  - `StudentDocument.Archive`
  - `StudentDocument.AccessLog.View`
  - `StudentDocument.Version.Create`
- Academic context: one synthetic academic year linked to the synthetic school and branch.
- No wildcard, `Student.*`, `Admin.*`, Delete, or Permission Registry permission was created.

## Preflight Evidence

Before live tests, the database join across `users`, `user_roles`, `roles`, `role_permissions`, and `permissions` returned exactly one app assignment, one role, six permissions, and six role-permission rows. Wildcard count was zero.

The project’s existing tenant contract requires the trusted `tenantId` and `schoolId` to match. The fixture was aligned to that existing contract; no source change was made.

## Cleanup

All synthetic database rows were removed after testing in a request-scoped transaction and verified with zero remaining rows for the fixture app user, role, permissions, user-role assignment, category, and academic year. Both synthetic Auth users were deleted through the Supabase Auth dashboard. Existing performance-test Auth users remained present.

## Security Note

The current Staging database has RLS disabled on the inspected platform, identity, academic-context, and student-document tables. The database role `edupro_staging_app` reports `rolbypassrls = false`. AUTH-004A did not change this posture because RLS changes are explicitly outside mission scope.

