# AUTH-004A — Live Staging Certification Report

## Environment

- Environment: Staging only
- Supabase project: `edupro-school-erp-staging`
- Application: `edupro-school-erp-staging.onrender.com`
- Production: not accessed or modified

## Test Matrix

| Test | Expected | Result |
|---|---:|---:|
| Supabase password authentication | 200 | PASS — 200 |
| Application login with trusted identity | 200 | PASS — 200 |
| Authenticated session restoration | 200 | PASS — 200 |
| Missing authentication | 401 | PASS — 401 |
| Invalid bearer token | 401 | PASS — 401 |
| Valid refresh token | 200 | PASS — 200 |
| Invalid refresh token | 400/rejected | PASS — 400/rejected |
| `StudentDocument.View` category read | 200 | PASS — 200 |
| `StudentDocument.Create` category create | 201 | PASS — 201 |
| Endpoint requiring an ungranted permission | 403 | PASS — 403 |
| Client-supplied role/school/tenant forgery | rejected | PASS — 403 |
| Unknown/ungranted permission behavior | fail closed | PASS — protected endpoint returned 403 |
| Role/permission resolution from live database | allow only fixture grants | PASS — live DB join and authorized routes succeeded |
| RLS enabled on inspected tables | required | BLOCKED — RLS is disabled |
| Application DB role bypasses RLS | false | PASS — `rolbypassrls = false` |

## Authorization Coverage

The six requested document permissions were present during the live test and were removed during cleanup. The allow path was exercised through category read and category create. Denial was exercised through a route requiring a permission outside the six-grant fixture and through forged client identity headers. A separate second Auth role was not created because the same live role’s minimum-grant boundary provided the required fail-closed denial without expanding the temporary fixture.

## Certification Decision

**IMPLEMENTED — CERTIFICATION BLOCKED**

Authentication, trusted session handling, live database role resolution, permission allow/deny behavior, refresh, and cleanup passed. Full certification cannot be issued while RLS is disabled on the inspected tables. Enabling and testing RLS requires a separate approved database-security mission.

## Scope Integrity

No application files, migrations, schema objects, RLS policies, permission registry entries, Production resources, or persistent non-synthetic rows were modified.

