# ACC-004-P0 — Live Identity and Regression Verification

## 1. Executive status

The live smoke contract now proves that the public Worker is serving the
`de225da` release. The Cloudflare Deployments page still presents an older
manual version (`e629c426`) as the traffic view, so the dashboard state and the
runtime identity must be reconciled operationally before declaring the release
fully closed.

## 2. Runtime evidence

Command:

```text
PRODUCTION_URL=https://schoolfor-manus.salafe10.workers.dev npm run smoke:production
```

Result: `success: true`

- health: HTTP 200
- version: `master-38`
- commit: `de225da13557ee5ebe8694f67b06c1d61683abdc`
- builtAt: `2026-09-19T10:15:47Z`
- index: HTTP 200
- asset: `/assets/index-D4eipdyt.js`
- failures: none

This is stronger evidence than an HTTP 200 alone because the smoke gate
validates version, commit, build timestamp, index, and the referenced asset.

## 3. Regression evidence

The following focused tests passed in the current worktree:

- `studentAffairsMetricsBranchScope.test.ts`
- `studentAffairsMetricsErrorBoundary.test.ts`
- `fallbackStorageCanonicalBoundary.test.ts`
- `tenantAuthControlPlaneIsolation.test.ts`
- `workspaceReadNoDdl.test.ts`

Summary: 5 test files, 5 tests passed. `npm run lint` and `git diff --check`
also passed.

## 4. Deployment reconciliation still required

Cloudflare build history reports build `de225da` as successful, while the
Deployments page showed `e629c426` as the active manual deployment. The live
health contract reports `de225da`. This is a deployment-control-plane
inconsistency, not evidence to reopen application code or to weaken the smoke
gate.

Required next operational check:

1. Confirm the Cloudflare traffic/version view refreshes to the runtime release.
2. If it does not, perform an authorized Cloudflare promotion/deploy using the
   existing account credential path.
3. Re-run the smoke gate and record the resulting active version.

Cloudflare's production Build configuration was updated to use
`node scripts/cloudflare-deploy.mjs` as the Deploy command. This keeps the
Git-derived commit and build timestamp injection in the managed build path;
the previous `npx wrangler deploy` command omitted those values.

No API token or secret was written to the repository or guessed from the
environment.

## 5. Financial gate

Financial reads requiring the live authenticated application path remain under
verification. Receipt, payment, journal, approval, posting, migration, and
other financial writes remain closed. No database mutation was performed.

## 6. Final status

`VERIFIED — RUNTIME IDENTITY AND REGRESSION GATE PASS; CLOUDFLARE ACTIVE-VIEW RECONCILIATION AND FINANCIAL READ VERIFICATION REMAIN`
