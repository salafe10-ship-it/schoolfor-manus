# STG-005 — Staging Student Registration E2E Certification

## Mission

- Mission ID: `STG-005`
- Environment: Staging only
- Supabase project: `edupro-school-erp-staging`
- Render service: `edupro-school-erp-staging`
- Tested deployment: commit `6b45786`
- Production access: none
- Production changes: none

## Scope and safety controls

The run used synthetic identities and synthetic tenant data only. Authentication was performed through Supabase Auth and the deployed Render API. No client-supplied identity, school, branch, role, academic year, audit actor, or token was trusted. No RLS, migration, or schema change was made.

## Results

| Check | Result | Evidence |
|---|---|---|
| Trusted Auth login through Render | PASS | HTTP 200; trusted session token returned by the deployed login endpoint |
| Session restoration | PASS | HTTP 200 from `/api/auth/session` with the authenticated identity |
| Tenant context correction | PASS | Canonical `academic_years` resolution succeeded with trusted tenant/school/branch scope |
| Academic year and term resolution | PASS | Active synthetic academic year and term were accepted by the deployed Staging service |
| Real authenticated registration | PASS | HTTP 201 from the deployed Render endpoint |
| Idempotent replay | PASS | HTTP 200, original result returned, no additional student row |
| Idempotency conflict | PASS | HTTP 409 `STU-IDM-001` for same key with a different payload |
| Duplicate controls | PASS | Duplicate rejected with `STU-DUP-001`; authorized override committed and was audited |
| Guardian isolation | PASS | Cross-tenant and cross-branch guardian IDs were rejected |
| Authorization controls | PASS | A role without registration permission was rejected with HTTP 403; privileged override path was separately verified |
| Atomic rollback | PARTIALLY VERIFIED | Controlled duplicate-guardian failure left every observed business-table count unchanged |
| Concurrency | PASS | Four concurrent registrations committed with four distinct student IDs and links |
| Audit persistence | PASS | Audit rows contained trusted actor, tenant, school, branch, request, correlation, action, and result |
| Outbox persistence | PASS | `StudentRegistered` rows contained aggregate, version, tenant, idempotency, request, and correlation data |
| Fixture cleanup | PASS | Synthetic Auth and public fixtures were removed and verified absent |
| Production impact | PASS | Production was not accessed or modified |

## Registration request

The request included a real Supabase Auth bearer token and a server-required `Idempotency-Key`. It was sent to the Staging Render URL after the TenantEngine correction. The successful response was:

- HTTP status: `201`
- Result: registration committed successfully
- Persistence: one student, guardian, link, enrollment, academic status, status transition, status history, audit event, and outbox event were verified in PostgreSQL

The idempotent replay returned HTTP `200` with the original student ID. Reusing the same key with a changed payload returned HTTP `409` with `STU-IDM-001`.

## Root cause

The original deployed `TenantEngine` provider queried `public.academic_calendars` using legacy fields. The verified Staging schema contains `public.academic_calendar` (singular), `academic_years`, and `terms`; `public.academic_calendars` is absent. STG-005A corrected the provider to use `academic_years`, scoped by trusted tenant, school, branch, deletion state, and lifecycle status. Configured Staging/Production paths now fail closed instead of falling back to local mock identifiers.

No duplicate table was created, no request values were trusted, and tenant validation remained fail-closed.

## Business-state verification

During the successful run, PostgreSQL persistence was verified across the complete registration aggregate. After cleanup, the following tenant-scoped tables all contained zero synthetic rows:

- `students`
- `guardians`
- `student_guardians`
- `enrollments`
- `student_academic_status`
- `student_status_transitions`
- `student_status_history`
- `audit_events`
- `outbox_events`

The controlled rollback case caused by a duplicate guardian number returned a conflict and left all observed counts unchanged, with no residual guardian, transition, audit, or outbox row for the failed request. Controlled failure injection at every individual persistence stage was not available without modifying prohibited transaction/business code; those subcases were not manufactured as passes.

## RLS gate

`RLS STATUS: DISABLED` for the reviewed Staging business tables. Therefore:

> DATABASE-LEVEL TENANT ISOLATION NOT CERTIFIED

RLS was intentionally not modified in STG-005 or STG-005A. This is a separate DB security certification gate and does not alter the functional E2E result above.

## Certification decision

**E2E FUNCTIONALLY CERTIFIED — DATABASE-LEVEL TENANT/RLS CERTIFICATION PENDING**

Authentication, trusted session restoration, canonical tenant/academic context resolution, registration persistence, idempotency, duplicate controls, guardian scope denial, authorization denial, rollback evidence, concurrency, audit, outbox, and cleanup were verified in isolated Staging. RLS remains disabled and therefore database-level tenant isolation is not certified.

## Required next action

Open the separate DB-SEC-001 tenant isolation/RLS certification gate. Do not claim Production Ready from STG-005A alone.
