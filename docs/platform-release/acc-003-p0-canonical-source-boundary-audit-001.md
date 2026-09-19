# ACC-003-P0 — Canonical Source Boundary Audit

Date: 2026-09-19
Status: IN PROGRESS — inventory and guard evidence recorded

## 1. Executive status

`FallbackStorage` is a compatibility layer, not an approved production source
of truth. The production guard is present in
`src/database/repositories/FallbackStorage.ts`:

- browser production origin, `NODE_ENV=production`, staging, canonical mode,
  or configured Supabase marks persistence as canonical-required;
- `assertCanonicalPersistence()` throws `CanonicalPersistenceError` instead of
  returning a local result;
- Cloudflare runtime does not have a writable project filesystem.

No migration, schema, RLS change, or financial write was performed for this
audit.

## 2. Inventory classification

| Surface | Observed compatibility source | Production decision | Evidence / next check |
|---|---|---|---|
| Students | `FallbackStorage` collections and seed imports | Not authoritative in production | Verify every API route remains canonical-gated |
| Fees / invoices / installments | `FallbackStorage` collections are present for local compatibility | P0: no financial success may come from this layer | Existing financial read/write guards must remain mandatory |
| Accounting / GL / vouchers | Local collections exist for compatibility | P0: prohibited as production source | Verify posting and reports use canonical repositories only |
| Inventory | Local collections exist | Prohibited if used as inventory truth in production | Trace receive/issue/adjustment routes |
| HR / employees | Local collections exist | Prohibited as production truth | Trace employee and sensitive-data routes |
| Reports | Local collections are not a report source | Must derive from canonical records | Add source-trace assertions where missing |
| UI preferences / drafts | `localStorage` may be acceptable when explicitly non-canonical | Allowed only when the feature contract says local-only | Must not be reused by domain reads |
| Demo/test fixtures | Seed files exist | Test/dev only | Never exposed as production success |

## 3. Guard evidence

The guard is centralized in `FallbackStorage.isCanonicalPersistenceRequired()`
and `FallbackStorage.assertCanonicalPersistence()`. The guard throws on the
fallback read/write path when canonical persistence is required. This means
the correct production behavior for an unavailable canonical source is an
explicit failure, not an empty or synthetic result.

The presence of a fallback collection alone is not evidence of a production
defect; each caller still needs classification. Deleting the compatibility
layer globally would risk local development and test behavior.

## 4. Remaining P0 checks

1. Trace all financial callers of `FallbackStorage` and prove they cannot
   return success after canonical persistence failure.
2. Trace report callers and prove every financial number has a canonical
   source path.
3. Add tenant-isolation and false-success tests for any caller that is not
   already covered.
4. Preserve the financial write gate until the financial read timeout and
   deployment identity are independently verified.

## 5. DB/owner decisions not executed

This audit does not authorize changes to account mappings, dimensions,
financial schema, RLS, migrations, revenue policy, or posting lifecycle.
Those remain separate owner/DB decisions.

## Final status

`CANONICAL BOUNDARY GUARD PRESENT — CALLER-LEVEL FORENSICS REQUIRED`

