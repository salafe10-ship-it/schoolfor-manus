# RELEASE-INFRA-002 — Server Bundle / Build Environment Readiness Audit

## Decision

`RELEASE-INFRA-002 = BLOCKED — BUILD ENVIRONMENT / RELEASE CONFIGURATION EVIDENCE INCOMPLETE`

This is a read-only audit. No Vite, esbuild, server code, deployment configuration, database, or production environment was modified.

## Build and runtime contract found in the repository

- `npm run build` runs `vite build` followed by `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.
- `npm run start` runs `node dist/server.cjs`.
- `npm run build:spa` runs only `vite build`; it does not create the server bundle required by `npm run start`.
- `server.ts` binds to `process.env.PORT || 3000` on `0.0.0.0`.
- Production serves the `dist` directory and uses the generated server bundle.
- `/api/health` is a liveness-style response and always returns HTTP 200 with `success: true`.
- `/api/ready` is the database-backed readiness endpoint and returns HTTP 503 until startup readiness becomes `READY`.

## Evidence gaps

- No `render.yaml`, Dockerfile, Procfile, or other repository deployment manifest was found.
- No `.github` CI workflow was found.
- The repository contains `package-lock.json`, `pnpm-lock.yaml`, `bun.lock`, and `pnpm-workspace.yaml`; there is no documented single package-manager authority for the release build.
- The Render build command, start command, Node version, and health-check path are not reproducible from repository configuration alone.
- No repository-owned release check proves that Render uses `npm run build` and `npm run start` rather than the SPA-only path.

## Reproducible local blocker

The required server bundle was attempted through the project command path and the installed esbuild binaries. All available paths reproduced:

```text
Cannot read directory "../..": Access is denied
Could not resolve "./server.ts"
```

The failure is independent of the notification and DMS changes. It is a build-environment/path-resolution blocker. Vite production build and TypeScript remain independently successful.

## Operational implications

- A green Vite build alone does not prove that the Express server artifact exists.
- If Render invokes `build:spa` while `start` expects `dist/server.cjs`, deployment can be structurally inconsistent.
- A health check against `/api/health` can report healthy while `/api/ready` reports database unavailability; the operational health-check contract is therefore not evidenced.
- Multiple lockfiles increase the risk of dependency graph drift between local and Render builds.

## Required owner/operations evidence before release certification

1. Confirm the authoritative package manager and lockfile.
2. Confirm Render build and start commands and the Node runtime version.
3. Confirm the Render health-check path is `/api/ready` for database-backed readiness.
4. Produce a successful server bundle artifact in a clean, reproducible build environment.
5. Confirm the deployed artifact starts and responds on the configured dynamic port.

