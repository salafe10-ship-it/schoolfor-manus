# PERF-002 — Staging Validation

## Deployment

- Environment: `edupro-school-erp-staging` only.
- Branch: `codex/sop-001-staging`.
- Commit: `e9768a6` (`PERF-002 canonical student read path`).
- Render deployment: live on the Staging service.
- Production: not deployed and not modified.

## Local validation

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | PASS |
| Focused canonical-read tests | PASS — 4/4 |
| Full Vitest suite | PASS — 17 files, 114 tests |
| Vite production build | PASS |
| Server bundle | PASS — existing 4 `import.meta` CJS warnings only |
| `git diff --check` | PASS — line-ending warnings only |

## Staging E2E observations

| Scenario | Result |
|---|---|
| Unauthenticated `GET /api/students` | 401 — PASS |
| Supabase Auth login with temporary Staging user | 200 — PASS |
| Authenticated `GET /api/students` | 403 — BLOCKED before repository execution |
| SOP-001 registration | 403 — BLOCKED before business transaction |
| Forged `schoolId` query value | 403 — BLOCKED before repository execution |
| Temporary fixture cleanup | PASS — all seven fixture counts zero |

The 403 response was the existing tenant-resolution failure documented in `perf-002-failure-rca.md`, not a canonical repository failure. Since the protected request did not reach the Student read repository, no valid Staging p50/p95/p99 performance measurement can be claimed for the corrected read path.

## Certification decision

**PERF-002: NOT CERTIFIED — STAGING TENANT RESOLUTION BLOCKER.**

Correctness and performance certification must remain pending until the existing authenticated tenant lookup path can read the trusted school/branch/academic-year records under DB-SEC-003 without weakening RLS or using a service-role bypass.
