# PERF-002 — Failure RCA

## Failure

The deployed canonical Student read path could not be certified end to end because the protected HTTP request was rejected by the existing tenant resolver before `CanonicalStudentReadRepository` was called.

## Evidence

1. Supabase Auth login succeeded for a temporary Staging user with HTTP 200.
2. An unauthenticated Student list request returned HTTP 401 as expected.
3. Authenticated Student list and Student Registration requests returned HTTP 403 with the existing tenant error: the school associated with the trusted identity could not be found.
4. The temporary Staging tenant, school, branch, academic year, term, public user, and Auth user were removed; verification returned zero remaining fixture rows.
5. DB-SEC-003 remains enabled and unchanged.

## Root cause

`TenantEngine` resolves school existence through the shared Supabase client created with the anonymous key. The internal lookup does not carry the authenticated user's JWT/app metadata. With DB-SEC-003 enabled, the lookup cannot satisfy the trusted tenant RLS conditions, so tenant validation fails closed.

This is an existing Authentication/TenantEngine integration defect exposed by the stricter database isolation. It is outside the PERF-002 read-repository change and must not be fixed by weakening RLS, granting a bypass role, or trusting request-supplied tenant values.

## Impact

- No production data was changed.
- No Student write was committed during the blocked E2E run.
- The new canonical read repository remains locally verified and deployed, but its live HTTP correctness is unproven until the tenant boundary is repaired.
- Performance numbers collected while requests were rejected are not valid read-path benchmarks and are intentionally excluded from certification.

## Safest next action

Open a separate CTO-approved remediation for the TenantEngine's authenticated lookup path. The fix must preserve DB-SEC-003, use trusted server context, and include tenant-resolution, RLS, registration, Student-read, cross-tenant, and rollback tests. Do not alter PERF-002's canonical repository or bypass the database security layer as a workaround.

## Decision

**Outcome C — Student read path not certified end to end.**
