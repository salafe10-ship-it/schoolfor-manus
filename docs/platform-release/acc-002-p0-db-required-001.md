# ACC-002-P0-DB-REQUIRED-001

## Status

Pending accounting-owner/model review. This specification is not an instruction to apply SQL or modify production.

## Evidence

- The live financial read path is `GET /api/financial/database`.
- The canonical accounting tables currently present are `erp_chart_of_accounts`, `erp_journal_entries`, `erp_journal_lines`, `erp_general_ledger`, and `erp_expense_accruals`.
- Existing journal lines store `cost_center` as text; no verified canonical cost-center or academic-stage reference table was present in the inspected schema result.
- The proposed `erp_account_groups` and `erp_cost_centers` migration has not been applied.
- The live UI correctly remains read-only when the canonical financial source does not answer within the client deadline.

## Exact decision required

The accounting owner must decide, before any migration is applied:

1. Whether account groups are distinct from the existing account nature/classification.
2. Whether cost center and academic stage are independent dimensions, and which transaction types require each.
3. Whether dimensions belong on journal lines, journal headers, or both.
4. Whether posted dimensions are immutable and how corrections are represented.
5. Which existing schools, accounts, mappings, and posted lines require a reviewed backfill, if any.

## Required database work after approval

Only after the decisions above are recorded: finalize the migration, constraints, tenant/school RLS policies, indexes, read-model queries, and end-to-end tests. No balances, mappings, or transactions may be generated as part of the migration.
