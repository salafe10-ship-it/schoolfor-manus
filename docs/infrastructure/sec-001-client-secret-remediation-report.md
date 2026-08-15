# SEC-001 — Client Secret Handling Remediation

## Scope

The Developer Platform Center was reviewed for browser-side handling of Supabase credentials and for misleading database connection claims.

## Remediation

- Removed the client-side `SUPABASE_SERVICE_ROLE_KEY` input entirely.
- Removed the client-side state that accepted a service-role value.
- Replaced the hard-coded project URL with a non-secret placeholder.
- Changed the connection control to call the server health endpoint instead of simulating a Supabase database success.
- Updated the UI language so application-server availability is not presented as PostgreSQL verification.
- Server-side connection configuration remains the only permitted location for private database credentials.

## Validation

- `pnpm run lint`: PASS
- `pnpm run test -- --run`: PASS — 14 files, 97 tests
- `pnpm run build`: PASS
- Build warnings remain for large chunks and `import.meta` in CommonJS output; they do not block this remediation.

## Dependency Audit

- `dompurify` was upgraded to `3.4.13` in `package.json` and `package-lock.json`.
- `nanoid` was pinned to the patched `3.3.17` resolution in `package-lock.json`.
- `xlsx@0.18.5` remains open because the npm package line available to this project has no patched release at or above the advisory threshold. Current source usage is export-only through `src/utils/ExportUtils.ts`; no untrusted workbook parsing path was found. Replacing it still requires a separate compatibility review for export workflows.

## Security Result

No service-role credential input or service-role reference remains in the active `src` code path. This remediation does not prove live PostgreSQL connectivity and does not modify Production or the database schema.

## Status

READY FOR CTO REVIEW
