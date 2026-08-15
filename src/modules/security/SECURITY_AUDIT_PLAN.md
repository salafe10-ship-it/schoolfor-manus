# Enterprise Security Audit & Hardening Plan

## Phase 1: Identity & Authentication
- [ ] Verify Argon2id implementation strength.
- [ ] Audit refresh token rotation logic for session fixation protection.
- [ ] Validate MFA architecture preparedness.

## Phase 2: Authorization (RBAC/ABAC)
- [ ] Audit `authorizationEngine.ts` to ensure permissions are strictly database-driven.
- [ ] Validate custom/time-limited role enforcement.

## Phase 3: RLS & Tenant Isolation
- [ ] Deep audit all database RLS policies for potential cross-tenant leakage.
- [ ] Verify that every query in the system explicitly handles tenant constraints (`schoolId`, `branchId`).

## Phase 4: API & Data Protection
- [ ] Audit API endpoints for input validation, rate limiting, and output filtering.
- [ ] Validate database secret management (no hardcoded credentials).

## Phase 5: Auditability & Compliance
- [ ] Verify that audit logging is truly atomic within business transactions.
- [ ] Audit the `AuditEngine` to ensure old/new value capture is complete and sanitized.
