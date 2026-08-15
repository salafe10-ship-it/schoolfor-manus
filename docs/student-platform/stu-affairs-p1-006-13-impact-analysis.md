# STU-AFFAIRS-P1-006-13 — Lifecycle Impact Analysis

## Business impact

| Finding | Business impact | Customer impact | Integrity/security impact |
|---|---|---|---|
| Fixed graduation registry | A graduation may appear approved with values not sourced from a real academic record | High confidence damage; certificates/reports can be wrong | High: false canonical data |
| Legacy status vocabulary | Student may enter a state that has no approved enterprise meaning | High: inconsistent screens and reports | High: state-machine bypass risk |
| Transfer not durable | School/branch movement may not have a defensible history | High for multi-school customers | Critical cross-tenant/enrollment risk |
| Hardcoded academic year | Promotion history can be attributed to the wrong year | High in annual reporting | High historical integrity risk |
| Missing lifecycle history | Customer cannot reconstruct who changed status and why | High during disputes/audits | High auditability gap |
| Duplicate restore paths | Same business action can behave differently by endpoint | Medium/high operator confusion | Medium consistency risk |
| Broad Student.Write | Different transitions can lack distinct approval boundaries | Medium/high governance risk | High least-privilege gap |
| Missing idempotency/version contract | Retries can duplicate or overwrite lifecycle actions | Medium operational risk | High concurrency/data-loss risk |
| FallbackStorage in withdrawal checks | A canonical action may rely on a different persistence source | High when records diverge | High tenant/transaction consistency risk |
| Outbox not proven | Downstream systems may not receive lifecycle events reliably | Medium/high integration confidence loss | High eventual-consistency risk |

## Priority interpretation

- **P0:** A release blocker or integrity/security boundary that can create materially false or cross-scope records. LIF-01, LIF-02, and LIF-03 remain blocked by decisions/dependencies rather than safe local edits.
- **P1:** A serious audit, concurrency, integration, or historical correctness gap that must be resolved before enterprise certification.
- **P2:** Important domain/API consistency and legacy cleanup gaps.
- **P3:** UX/notification cleanup after canonical behavior is approved.

## Safe sequencing

1. Owner approves status vocabulary and transition policy.
2. Owner approves academic-year/term/enrollment effects.
3. Schema/API owners approve history, graduation, idempotency, concurrency, and outbox contracts.
4. Security/Operations approve transfer scope, persistence retirement, workers, and observability.
5. Only then implement and test lifecycle corrections in one controlled mission.

## Decision boundary

No finding in this report authorizes a code change. Any direct “quick fix” to one service before the shared contract is approved risks preserving divergent state models.

