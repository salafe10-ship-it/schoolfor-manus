# STU-AFFAIRS-P1-006-23 — Approval Matrix

## Status vocabulary

- `UNDECIDED`: no owner decision recorded.
- `APPROVED`: explicit owner approval required; not inferred from a recommendation.
- `REJECTED`: explicit owner rejection required.
- `IMPLEMENTATION BLOCKED`: no code change may begin while a required decision is undecided.

## Operation approval matrix

| Operation | Current state | Proposed containment | Domain | Security | Operations | Architecture | Final |
|---|---|---|---|---|---|---|---|
| Promote | Legacy reachable | Block/Gate | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Re-enroll | Legacy reachable | Block/Gate | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Suspend | Mixed | Canonical-only target | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Dismiss | Legacy reachable | Block/Gate | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Archive | Mixed | Canonical-only target | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Restore | Mixed | Canonical-only / correction contract | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk Promote | Legacy reachable | Block | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk Archive | Legacy reachable | Block | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Bulk Transfer | P0 dependency | Block | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED | UNDECIDED |
| Unknown Bulk Operation | Unsafe generic envelope | Fail-closed 4xx | — | UNDECIDED | — | UNDECIDED | UNDECIDED |

## Cross-cutting approval matrix

| Control | Required decision owner | Current evidence | Final |
| Resolved `TenantContext` before Bulk dispatch | Security / Architecture | Not proven on Bulk route | UNDECIDED |
| Per-item school/branch scope | Security | Not proven | UNDECIDED |
| Operation-specific permissions | Security | Broad `Student.Write` observed | UNDECIDED |
| Canonical lifecycle writer | Domain / Architecture | Not selected | UNDECIDED |
| Canonical Enrollment owner for Re-enroll/Promote | Academic / Architecture | Dependency required | UNDECIDED |
| One transaction boundary | Operations / Architecture | Nested Unit of Work risk | UNDECIDED |
| Idempotency and retry | Operations | Not proven for Bulk | UNDECIDED |
| History, Audit, Outbox | Domain / Security / Operations | Legacy paths not proven canonical | UNDECIDED |
| Graduation containment | Domain / Security | `GRADUATION_NOT_READY` active | APPROVED AT CODE-LEVEL / DO NOT REOPEN |

## Decision rule

No `UNDECIDED` row may be treated as approval. This file records the handoff state only.

