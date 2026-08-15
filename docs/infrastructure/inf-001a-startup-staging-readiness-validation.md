# INF-001A — Validation Evidence

## Required gates

| Gate | Result | Evidence |
|---|---|---|
| Startup readiness state contract | PASS | `src/__tests__/startupReadiness.test.ts` |
| Supabase finite timeout contract | PASS | `src/__tests__/supabaseStartupIsolation.test.ts` |
| Production migration/seed separation | PASS | Startup contract and production blocker tests |
| Focused INF-001A tests | PASS — 19/19 | 4 test files |
| Full regression suite | PASS — 325/325 | 61 test files |
| TypeScript | PASS | `tsc --noEmit` |
| Vite production build | PASS | `pnpm run build` |
| Server bundle | PASS | `dist/server.cjs` generated |
| Local smoke: `/api/health` | PASS — HTTP 200 | Production-mode isolated port |
| Local smoke: `/api/ready` without Supabase | PASS — HTTP 503 | `DEGRADED / UNAVAILABLE`, no secret output |
| Render Staging deploy | PASS | Commit `19df6d8b8900623ede9da63389a2bbec8dc720e2` deployed successfully |
| Render Staging `/api/health` | PASS — HTTP 200 | `startup.state=READY`, `database=CONNECTED`, `ready=true` |
| Render Staging `/api/ready` | PASS — HTTP 200 | `state=READY`, `database=CONNECTED`, `ready=true` |
| Render Staging restart | PASS | Restart produced a new startup timestamp, followed by readiness 200 |
| Production touched | PASS — no | Staging-only deployment and verification |

## Build warnings

The existing server bundle emits four non-blocking `import.meta`/CommonJS warnings in financial closing files. They are outside INF-001A and do not prevent the build from completing.

## Security evidence

Readiness responses expose only state, database status, timestamps, and a fixed safe reason. No URL, key, password, token, connection string, or service-role value is returned.

## Closure

The code-level and live Render Staging gates pass. Supabase-backed readiness was observed as `READY/CONNECTED`; no migration or seed operation was triggered. Production was not deployed or modified.
