# ACC-001-IMPLEMENTATION-003 — Technical Hardening Report

## Scope

Technical-only accounting hardening under the consultant order. No financial mapping, posting rule, fiscal-period rule, reversal policy, tax rule, valuation method or schema change was introduced.

## Fixes completed

1. Chart-of-accounts deletion now fails closed without the approved `ledger:delete` permission or trusted school/user identity.
2. Chart deletion uses `selectedSchool.id` and the active drill-down user instead of fixed `school_1`, fixed manager identity and fixed LAN address.
3. The deletion transaction result is awaited; account state and success notification are applied only after a successful result.
4. Receipt and payment voucher UI paths stop before localStorage/React-state success when canonical persistence is required.
5. Invoice creation stops before React-state success when canonical persistence is required.
6. The embedded posting-engine token-like string was replaced with a module-scoped capability symbol passed only through the PostingEngine adapter.
7. Financial report cards and account drill-down remain wired to their existing handlers.
8. Added focused static tests for these hardening guarantees.

## Validation completed

- TypeScript: PASS.
- Focused hardening tests: PASS, 4/4.
- Full regression: 723/727 tests passed; 4 pre-existing baseline failures remain visible and are outside this patch.
- Vite production build: PASS with existing large-chunk warning.
- Server bundle: PASS with 4 existing `import.meta`/CJS warnings.
- Scoped secret scan: PASS.
- Database and Supabase: untouched; no SQL, migration, RLS, RPC, or production change.

## Deliberately not changed

- account mappings and revenue codes;
- journal posting/approval policy;
- fiscal-period closing/reopening;
- reversal behavior;
- inventory valuation;
- payroll/assets ownership;
- opening balances;
- accounting schema, migrations, RLS, RPC or production data.

## Remaining P0/P1

Canonical accounting persistence, journal approval/posting implementation, GL source of truth, transactional closing, end-to-end integrations, server-side authorization, and production isolation remain unresolved and are listed in the ACC-001 gap register.

## Status

`P0/P1 TECHNICAL HARDENING PROGRESSED` — not `ACCOUNTING MODULE CLOSED`.
