# IDMAP-001 — Trusted School Identity Mapping

## Mission status

Implemented locally; ready for CTO review. No database, migration, RLS, Production, or unrelated module changes were made.

## Root cause

Trusted authentication resolved the school UUID from Supabase metadata, but the client session application layer attempted to resolve that UUID only against the legacy `saasSchools` presentation catalog. Real Staging school UUIDs were therefore rejected as an invalid session identity even after Supabase authentication succeeded.

## Safe implementation

- Added a dedicated trusted school resolver that reads the school record by the authenticated school UUID.
- Preserved the exact UUID and server-resolved school fields in the trusted identity returned by login, refresh, and session verification.
- Allowed the UI to use the server-resolved school presentation; the legacy catalog remains only as an exact-ID compatibility fallback.
- Added fail-closed behavior for missing, incomplete, or mismatched school records.
- No client request body, header, local storage value, role selection, tenant selection, or branch selection is used as the source of school identity.

## Files changed for IDMAP-001

- `src/middleware/trustedSchoolIdentity.ts`
- `src/middleware/trustedAuthentication.ts`
- `src/middleware/trustedSessionManager.ts`
- `src/App.tsx` (trusted session application path only)
- `server.ts` (login and refresh response identity projection)
- `src/__tests__/trustedSchoolIdentityMapping.test.ts`

## Validation

- TypeScript: PASS (`bun run lint`)
- Focused identity/auth/session tests: PASS — 3 files, 20 tests
- Full Vitest suite: PASS — 26 files, 142 tests
- Production build: PASS; generated `dist` artifacts successfully
- `git diff --check`: PASS

## Security and scope controls

- School identity remains derived from trusted authenticated identity and server-side Supabase lookup.
- No UUID-to-legacy alias guessing or fallback by position/name was introduced.
- No database objects or data were changed.
- No RLS, tenant isolation, authorization, diagnostics, transaction, finance, or student business module was modified.

## Remaining live verification

After CTO approval, deploy this branch to Staging and repeat the controlled login/session-restore/diagnostic certification. The temporary Staging fixture used for the failed pre-fix attempt was removed, including its Auth user and application rows.
