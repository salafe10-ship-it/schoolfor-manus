# STU-AFFAIRS-P0-006-06 — Results Owner Decision Matrix

Status: `UNDECIDED — NO APPROVAL INFERRED`

| Decision | Recommendation for review | Owner | Status |
|---|---|---|---|
| Results source of truth | Establish a canonical Results domain; keep current JSON path transitional | Academic Affairs + Results | `UNDECIDED` |
| Result lifecycle | Review `DRAFT → CALCULATED → REVIEWED → APPROVED → LOCKED` | Academic Affairs | `UNDECIDED` |
| GPA formula | Publish an approved, versioned formula; do not infer from UI | Academic Affairs | `UNDECIDED` |
| Result locking | Lock after approval; corrections create a new version | Academic Affairs + Security | `UNDECIDED` |
| Correction workflow | Separate authority, reason, evidence, and immutable lineage | Academic Affairs + Operations | `UNDECIDED` |
| Enrollment linkage | Require enrollment and academic context on every canonical result | Enrollment + Academic Affairs | `UNDECIDED` |
| Term linkage | Require canonical term under academic year | Academic Affairs | `UNDECIDED` |
| Graduation eligibility | Consume only approved/locked results and an approved policy | Registrar/Academic Affairs | `UNDECIDED` |
| Result retention | Define retention, archive, legal hold, and purge rules | Operations + Compliance | `UNDECIDED` |
| Historical migration | Decide whether legacy JSON/mock data is discarded, quarantined, or transformed | Product + Operations | `UNDECIDED` |
| Tenant isolation | Enforce trusted tenant/school/branch scope at service and database layers | Security + Platform | `UNDECIDED` |
| Integration | Publish audit/outbox events only after canonical commit | Platform Governance | `UNDECIDED` |

## Approval rule

An `UNDECIDED` row cannot be treated as an implementation assumption. No Results schema, GPA engine, or Graduation implementation may start from this matrix until the required owners approve the corresponding decisions.

## Final status

`RESULTS DOMAIN CONTRACT REQUIRES OWNER APPROVAL`.
