# STU-AFFAIRS-P0-006-13 — Bulk Authorization and Tenant Containment Audit

## Mission mode

Discovery and Security Feasibility only. No Bulk request, cross-tenant test, SQL, service-role access, source change, database change, authorization change, tenant change, staging, or production operation was performed.

## Official classification

`P0-006-13 = SECURITY GAP PROVEN — IMPLEMENTATION REQUIRES SECURITY APPROVAL`

The audit proves material containment gaps in the Bulk path, especially branch/academic-year item scope, operation-specific authorization, and transaction/persistence ownership. It does **not** prove an executed cross-school mutation or an authorization-denied mutation that still committed. Therefore the direct P0 bypass stop condition was not triggered.

## Request path

`authenticateRequest → requirePermission(Student.Write) → tenantValidationMiddleware (indirectly through requirePermission) → POST /api/students/bulk → StudentService.executeBulkOperation`

### Request-level controls proven

- `authenticateRequest` verifies the Supabase session and derives identity from the trusted session.
- Client-selected `school_id` is rejected when it differs from the trusted identity school.
- `requirePermission(Student.Write)` resolves database permissions and calls the centralized authorization engine.
- The `requirePermission` wrapper invokes `tenantValidationMiddleware`, which resolves and validates TenantContext and checks request-level tenant/school/branch/academic-year targets.
- Bulk takes `schoolId` from `req.user.schoolId`, not from the request body.

### Controls not carried into the Bulk service

- `TenantContext` is not passed as the service contract; only `schoolId` is passed.
- The service does not perform an operation-specific authorization decision.
- Each item is not visibly revalidated against trusted branch and academic-year context.
- The Legacy repository update predicate uses `id`, `school_id`, and `version`; branch and academic year are not part of the predicate.

