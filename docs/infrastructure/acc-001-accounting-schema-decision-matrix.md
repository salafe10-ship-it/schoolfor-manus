# ACC-001 — Accounting Schema Decision Matrix

**Status:** Decision package; no schema or SQL is authorized  
**Decision:** `BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

| Area | Current evidence | Safe engineering constraint | Owner decision required | Status |
|---|---|---|---|---|
| Account identity | `Account.id`, `code`, `nature`, hierarchy fields exist in TypeScript | Identity must be stable, tenant/school scoped, and unique in its ownership scope | UUID vs governed code; ownership scope; code mutability | OWNER REQUIRED |
| Account type | Asset, liability, equity, revenue, expense types exist | Posting must respect account nature | Full type taxonomy and normal balance rules | OWNER REQUIRED |
| Hierarchy | `parentAccountId`, `level`, `hierarchyPath` exist | Only approved leaf/postable accounts receive journal lines | Root/parent rules, depth, re-parenting policy | OWNER REQUIRED |
| Active state | `isActive`, `isLeaf`, `isSystemProtected` exist | Inactive/non-postable accounts must reject new postings | Deactivation effects and historical visibility | OWNER REQUIRED |
| Chart ownership | Current code uses `schoolId`; enterprise tenant context exists | Cross-school account use must be rejected | Global template vs school-owned accounts; branch scope | OWNER REQUIRED |
| Student fee mapping | Hard-coded `CASH_ACCOUNT` / `REVENUE_ACCOUNT` exists in one engine | No hard-coded mapping may become production authority | Cash/bank, receivable, deferred revenue, tuition revenue mapping | BLOCKED |
| Receipt identity | Legacy UI uses `receiptVoucherId` and local keys | Receipt identity must be server-generated and idempotent | Numbering, source document, idempotency key, uniqueness scope | OWNER REQUIRED |
| Receipt lifecycle | Types include draft/posted/cancelled in legacy `Voucher` | Only an approved state may create financial effect | Receipt vs voucher distinction; transitions; approvals | OWNER REQUIRED |
| Journal identity | `JournalEntry` has id/reference fields | Journal must link to receipt and source request | Journal number, source relation, aggregate identity | OWNER REQUIRED |
| Journal lines | `items[]` with debit/credit exists | At least one debit and credit; balanced totals | Line fields, precision, currency, cost center, branch | OWNER REQUIRED |
| Balance source | Code mutates `Account.balance`; ledger lines also exist | Reports need one authoritative source | Stored balance, derived balance, or projection and rebuild rule | BLOCKED |
| Ledger identity | `GeneralLedger` includes reference type/id | Each posted line must be traceable to journal/receipt | Ledger partitioning, period, version, correction policy | OWNER REQUIRED |
| Posting order | `PostingEngine` suggests Receipt → Journal → GL/Balance | No partial financial effect | Exact order and posting authority | OWNER REQUIRED |
| Reversal | Code contains an attempted mirror reversal and unpost path | Posted history must not be erased | Reversal vs adjustment, period-close behavior, approvals | BLOCKED |
| Idempotency | No approved key contract found | Same command must not create duplicate effect | Key format, unique scope, replay response, unknown outcome | BLOCKED |
| Concurrency | Version fields exist in enterprise architecture but not proven in Accounting path | Concurrent posts must not lose or double count | Expected version, row lock/serializable policy, retry rule | OWNER REQUIRED |
| Period close | Code checks fiscal year/period status from fallback state | Closed periods reject new effects | Close authority, reopening, correction window | OWNER REQUIRED |
| Audit | `AuditRepository.log` exists | Audit is append-only and in trusted context | Event taxonomy, required fields, transaction coupling | OWNER REQUIRED |
| Outbox | Governance outbox exists | Integration event must follow committed financial effect | Event type/version/payload and retry semantics | OWNER REQUIRED |
| Retention | No Finance retention contract found | Financial history must remain reportable | Retention, archive, legal hold, purge prohibition | OWNER REQUIRED |

## Decision rule

Any `BLOCKED` or `OWNER REQUIRED` row prevents DB-003 implementation. Engineering must not select values for account mapping, balance semantics, reversal, idempotency, or concurrency on behalf of the Accounting owner.
