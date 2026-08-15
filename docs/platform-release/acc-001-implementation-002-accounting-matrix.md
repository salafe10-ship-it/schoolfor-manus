# ACC-001-IMPLEMENTATION-002 — Accounting Function Matrix

| Function | UI present | Canonical persistence proven | Validation status |
|---|---:|---:|---|
| Chart of Accounts | Yes | No | Not release-ready |
| Journal entries | Yes | No | Posting lifecycle incomplete |
| Approve journal | Intended | No | Explicitly not implemented |
| Post journal | Intended | No | Explicitly not implemented |
| Receipts | Yes | No | local/fallback path |
| Payments | Yes | No | local/fallback path; partial fail-closed behavior |
| Student fees / invoices | Yes | No | React state/local path |
| Customers ledger | Yes | No | Depends on fallback state |
| Suppliers ledger | Yes | No | Depends on fallback state |
| General ledger | Yes | No | Canonical source not proven |
| Trial balance | Yes | No | Cannot certify debit=credit from production ledger |
| Financial statements | Yes | No | Derived from untrusted local/fallback state |
| Fiscal periods | Yes | No | localStorage close/open flags |
| Closing/reopening | Yes | No | Not atomic or server-enforced |
| Reversal | Intended | No | Policy and implementation incomplete |
| Bank transfers | Yes | No | Handler/integration not certified |
| Fixed assets | Yes | No | Persistence/integration not certified |
| Budget | Yes | No | Persistence/approval not certified |
| Audit/approvals | Partial | No | UI audit does not replace append-only server audit |

## Release gate

The accounting module remains blocked until each row has a canonical source, server-side authorization, transaction behavior, idempotency, audit evidence and automated regression coverage.
