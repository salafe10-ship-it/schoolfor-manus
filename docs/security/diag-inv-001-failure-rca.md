# DIAG-INV-001 Failure RCA

## Mission

Staging-only verification that the existing authenticated application session can invoke `/api/internal/staging/connection-identity` and display only the approved PostgreSQL connection identity fields.

## Result

**BLOCKED — certification could not be completed.**

The Staging deployment for commit `2da73cf` completed successfully on Render, but the temporary diagnostic control was not present in the live authenticated application UI after a fresh navigation and reload. Because the endpoint was not invoked through the required normal UI flow, no database identity result is certified.

## Evidence

- Render service: `edupro-school-erp-staging`.
- Render deployment: commit `2da73cf`, status `Deploy succeeded`, live deployment at 11:11 AM on 2026-08-10.
- Render build completed successfully; server started and established the Staging PostgreSQL connection.
- The authenticated Staging application loaded successfully at `https://edupro-school-erp-staging.onrender.com/`.
- The System Health screen loaded without browser console errors.
- The expected visible labels `هوية اتصال PostgreSQL في Staging` and `إعادة فحص الهوية` were absent from the live DOM after reload and after opening the System Health screen.
- The unauthenticated negative `401` behavior was already verified before this run.

## Root Cause

The exact production cause of the live UI mismatch could not be proven from the allowed surfaces. Source and commit inspection confirm that the temporary control exists in `2da73cf`; Render confirms that the commit deployed; however, the live UI did not expose the control. This is therefore classified as a deployment/runtime asset mismatch requiring a later controlled investigation.

No endpoint, database role, RLS policy, authentication flow, or production configuration was changed during this diagnostic.

## Cleanup

- Temporary Staging application fixture rows were deleted in one committed transaction.
- Verification query returned zero remaining rows for all five temporary fixture records.
- The temporary Staging Auth user was deleted through Supabase Auth UI; the user list no longer contained it.
- Production was not accessed or modified.

## Affected Mission Files

The temporary diagnostic UI and its narrow parsing test were removed after the failed certification:

- `src/components/SystemHealthCenter.tsx`
- `src/security/stagingDiagnosticInvocation.ts`
- `src/__tests__/stagingDiagnosticInvocation.test.ts`

The existing server endpoint was not modified.

## Required Follow-up

1. Reproduce the asset mismatch in a separate approved diagnostic mission.
2. Compare the deployed frontend asset manifest with the exact source tree for the deployment.
3. Reintroduce a temporary control only after the deployment path is proven to serve the intended asset.
4. Repeat authenticated UI invocation and certify the four approved fields only after the control is visibly available.
