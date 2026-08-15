# STU-AFFAIRS-P1-006-19A — Separate Atomicity UX Safety

## Decision

`P1-006-19A = CODE-LEVEL PASS`

The UI now reflects two independent operations without introducing a composite transaction.

## Changes

Only `StudentAffairsPortal.tsx` was changed:

- Tracks whether Guardian update started and whether it returned successfully.
- Tracks whether Student update started and whether a persisted Student response was returned.
- Shows a combined success message only after both independent results are known.
- If Guardian fails, does not send the subsequent Student request.
- If Guardian succeeds but Student result is not confirmed, reports Guardian success and Student uncertainty separately.
- Uses reload/reverification language for uncertain outcomes and does not claim total success.
- Leaves API, persistence, UnitOfWork, idempotency, tenant, authentication, authorization, and database logic unchanged.

## User-Visible Outcomes

| Scenario | UI result |
|---|---|
| Guardian success + Student success | Explicit success for two independent operations |
| Guardian failure | Guardian verification warning; Student request is not sent |
| Guardian success + Student failure/unknown | Guardian saved; Student result not confirmed; reload required |
| Student-only edit success | Existing Student success message |

## Test

Added `src/__tests__/stuAffairsP1AtomicityUx.test.ts` covering the four required safety properties.
