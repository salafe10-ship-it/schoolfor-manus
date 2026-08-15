# DOC-001R Validation Report

## Validation Matrix

| Area | Result | Evidence |
| --- | --- | --- |
| TypeScript | PASS | `tsc --noEmit` completed successfully. |
| Focused service tests | PASS | Trusted metadata, pagination validation, and commit rollback tests pass. |
| Full Vitest | PASS | 23 files, 131 tests. |
| Vite production build | PASS | 3045 modules transformed. Existing chunk/dynamic-import warnings only. |
| Server bundle | PASS | `dist/server.cjs` generated. Existing CJS `import.meta` warnings only. |
| `git diff --check` | PASS | No whitespace errors. |
| Database migration | NOT TOUCHED | EWP-005 schema remained frozen and canonical. |
| RLS/RPC/triggers/functions | NOT TOUCHED | No database security or infrastructure change. |
| Authentication/session | PASS | Existing middleware is the only authentication source. |
| Central authorization | PASS | All routes use registered `StudentDocument.*` permissions. |
| Tenant isolation | PASS STATIC | Every repository read/write has trusted tenant/school/branch scope; student scope is rechecked. |
| Audit metadata | PASS STATIC | Actor and timestamps are server-generated; request/correlation IDs are generated per request. |
| Immutable versions | PASS STATIC | No update/delete path exists; current-version transition is transactional. |
| Access log immutability | PASS STATIC | Read-only presentation endpoint; writes are append-only inserts. |
| Rollback | PASS | Simulated commit failure triggers UnitOfWork rollback and no successful result. |
| Staging deployment | PASS | Render auto-deployed commit `1e7539d` successfully in 18.0s on August 9, 2026 at 4:29:26 PM GMT+2. |
| Production impact | PASS | Production was not accessed or modified. |

## Required Live Staging Checks

After deployment, execute only against Staging with a trusted test identity:

1. Missing bearer token returns 401 for every protected route.
2. Missing or invalid permission returns 403.
3. Forged tenant/school/branch body, query, and headers are rejected.
4. Cross-school and cross-branch student targets are rejected.
5. Registration creates exactly one document, one version, one audit event, and one outbox event.
6. Repeating the same `Idempotency-Key` returns the original result without a second version.
7. Version creation leaves exactly one current version.
8. Verification records trusted actor/time and cannot be spoofed by request metadata.
9. Legal hold prevents archive and expiry.
10. Archived records cannot receive a new version; restore requires the approved archive permission and a reason.
11. Access logs are visible only within trusted scope and cannot be updated or deleted through the API.
12. A forced transaction failure leaves no partial document/version/audit/outbox state.

## Known Limitations

- Binary transport and provider-side content verification are intentionally out of scope.
- No UI was added; the approved screen contracts remain the UI authority.
- Live staging data validation requires a test identity and seeded tenant records; no seed data was created.
- The existing application build warnings remain unchanged and are not caused by DOC-001R.

## Decision

`IMPLEMENTED — CERTIFICATION BLOCKED`
