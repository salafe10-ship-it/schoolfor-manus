# RUNTIME-SURFACE-002 — Deployment / Artifact Forensics

## Mission

Read-only verification of the source-to-runtime chain for the temporary Staging diagnostic surface. No code, build configuration, environment variable, deployment setting, database, endpoint, or Production state was changed.

## Chain matrix

| Layer | Result | Evidence |
|---|---|---|
| Git source | PASS | The reviewed source is on `codex/sop-001-staging`; the code change is present in `3e0ef3f`, and current HEAD `958ab2e` contains the documentation-only forensic updates. |
| Render build/deployed commit | PASS | Render shows the branch and records `958ab2e` as the latest report deployment, with `be4e70c`, `ceaaed3`, and `3e0ef3f` in the same deployment chain. |
| Local build inclusion | PASS | The local Vite build produced `dist/assets/SystemHealthCenter-BGhXIwrU.js`; it contains both `staging-connection-diagnostic` and `/api/internal/staging/connection-identity`. |
| Browser artifact | UNKNOWN | The live page exposes `/assets/index-D1tAFQsP.js`. Direct static-asset inspection returned `ERR_BLOCKED_BY_CLIENT`; no bypass or alternate access was used. |
| Import chain | PASS | `App.tsx` lazy-imports `./components/SystemHealthCenter` and renders it when `activeSection === 'system_health'`. |
| Parent route | PASS | The live Staging page reaches the System Health route and exposes both health tabs. |
| Environment gate | PARTIAL | The server evaluates `EDUPRO_ENVIRONMENT === 'staging' && CONN_DIAGNOSTIC_ENABLED === 'true'` at request time. Vite client configuration does not inject those server runtime values into the browser bundle. No live environment value was read or changed. |
| Host gate | PASS in source / PASS live host | Source compares the exact hostname `edupro-school-erp-staging.onrender.com`; the live page reports that canonical hostname. |
| Conditional rendering | PASS in source / FAIL in DOM | Source renders the section when the exact host gate is true. Live DOM counts remained `diagnosticSectionCount = 0` and `diagnosticButtonCount = 0` after fresh loads and Live deployments. |

## First proven breakpoint

The first proven breakpoint is between the Render-deployed artifact and the runtime-rendered `SystemHealthCenter` surface. Git source, local build inclusion, import chain, route, and hostname gate are proven. The browser-loaded artifact’s contents are not observable from the approved surface, so it is not possible to distinguish stale artifact, alternate build output, runtime bundle selection, or another deployment mapping failure.

## Root cause

`DEPLOYED ARTIFACT / RUNTIME MAPPING = UNKNOWN`.

The available evidence is insufficient to claim a more specific root cause. The missing DOM surface is not evidence of a PostgreSQL, authentication, tenant-isolation, RLS, or authorization failure.

## Security boundary

No SQL Editor, `postgres`, `service_role`, `SET ROLE`, password, token, JWT, connection string, `DATABASE_URL`, secret, database, RLS policy, or Production access was used.

## Recommended next bounded mission

`RUNTIME-SURFACE-003` should use an approved read-only Render deployment/build artifact metadata surface to compare the deployed artifact identity and the loaded browser asset. It should not add code, endpoints, instrumentation, environment variables, or another diagnostic control until the artifact mapping is proven.

## Decision

`RUNTIME-SURFACE-002 = BLOCKED / INSUFFICIENT OBSERVABILITY`.

No `RUNTIME-SURFACE-003` implementation, `CONN-SEC-003`, `DB-SEC-004`, `AUTH-004A`, or `DOC-002` implementation is authorized by this report.
