# RELEASE-OPS-004 — Render Live Release Evidence

## Scope

Read-only evidence collection from the Render Staging service. No application code, database, migration, RLS, Storage, or production resource was modified.

Service: `edupro-school-erp-staging`

Service URL: `https://edupro-school-erp-staging.onrender.com`

Branch: `codex/sop-001-staging`

## Evidence captured

### Package manager and build/start commands

Render Settings shows the active build command:

```text
npm install && npm run build
```

Render Settings shows the active start command:

```text
npm run start
```

The deployment log confirms:

```text
> react-example@0.0.0 start
> node dist/server.cjs
```

The Render evidence proves npm is the active command path. It does not independently prove which lockfile was selected by `npm install`; the repository contains multiple lockfiles and no single lockfile authority is documented.

### Successful build artifact

The live deployment log for commit `c76acca09e804e5c9f40f967fc53ca9b59652527` records:

```text
dist/server.cjs 1.2mb
dist/server.cjs.map 2.0mb
Build successful
```

This resolves the previously local-only server-bundle concern for this Render deployment.

### Runtime startup

The same live deployment records:

```text
Your service is live
EduPro Enterprise ERP Server listening on port 10000
DB Connection Manager: Connection established successfully
Supabase linked!
Available at your primary URL https://edupro-school-erp-staging.onrender.com
```

The application log proves a dynamic Render-provided port was used, but the exact `0.0.0.0` bind statement is not emitted in the captured Render log. The source inspection previously confirmed the server binds to `0.0.0.0` with `process.env.PORT || 3000`.

### Health-check configuration

Render Settings displayed the Health Check Path field without a configured value. Therefore `/api/ready` is not proven to be the active Render health-check path.

### Live endpoint checks

Direct browser checks of `/api/health` and `/api/ready` during this evidence session reached Render's free-instance cold-start/interstitial page (`Application loading`) rather than returning the application JSON response. Consequently, HTTP 200 for either endpoint is **not certified** by this session.

### Node version

The Render Settings and deployment log captured in this session did not expose the exact Node.js version. Node version evidence remains pending.

## Current decision

`RELEASE-OPS-004 = BLOCKED — NODE VERSION, HEALTH-CHECK CONFIGURATION, AND LIVE ENDPOINT HTTP EVIDENCE PENDING`

The Render deployment itself is proven successful, including the server bundle, start command, runtime startup, database connection, and live service state. Release certification must not claim the remaining items without direct evidence.

