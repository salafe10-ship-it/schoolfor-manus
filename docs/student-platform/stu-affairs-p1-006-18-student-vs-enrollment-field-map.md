# STU-AFFAIRS-P1-006-18 — Student versus Enrollment Field Map

| UI or business field | Student Profile | Enrollment / Placement | Academic Status | Current decision |
|---|---:|---:|---:|---|
| Student ID / student number | Yes | References Student | No | Student-owned |
| Name and legal names | Yes | Reference only | No | Student-owned |
| Date of birth, gender, nationality | Yes | Reference only | No | Student-owned |
| Tenant, school, branch scope | Trusted context on both where applicable | Trusted context on both where applicable | Trusted context | Never client-owned |
| Academic Year | No | Yes: `academic_year_id` | Context reference | Enrollment/Core-owned |
| Term | No | Yes: `term_id` | Context reference | Enrollment/Core-owned |
| Classroom / class reference | No | Yes: `class_reference` | No | Enrollment-owned |
| Section reference | No | Yes: `section_reference` | No | Enrollment-owned |
| Enrollment status | No | Yes: `enrollment_status` | No | Enrollment-owned |
| Student academic status | No | No | Yes: Academic Status aggregate | Lifecycle-owned |
| Current placement display | Read-only projection | Derived from current trusted Enrollment | May filter eligibility | Contract not yet implemented |
| Transfer source/target | No | `enrollment_transfers` | Not a status | Enrollment-owned, business decision required |
| Effective date / placement reason | No | Enrollment history/change record | No | Enrollment-owned, decision required |
| Version / idempotency | Student profile version for Student writes | Enrollment version and operation idempotency | Status transition version/idempotency | Per aggregate, not shared casually |

## Mapping Rule

The Student Edit contract may submit only fields supported by the canonical Student write repository. Enrollment placement must use a future Enrollment application contract after owner and academic approval. The current UI payload fields `classroom` and `section` are therefore recognized as placement inputs but intentionally not persisted by Student Edit.

## Current Drift Classification

| Field | Classification | Safe action now |
|---|---|---|
| `classroom` | Contract drift caused by boundary mismatch | Keep out of Student write; route to future Enrollment contract |
| `section` | Contract drift caused by boundary mismatch | Keep out of Student write; route to future Enrollment contract |
| `status` | Lifecycle dependency | Do not map in Student Edit until Academic Status contract is approved |

## Security Boundary

No client-provided tenant, school, branch, academic year, term, or placement scope is trusted as identity. Any future Enrollment operation must derive scope from authentication, session, authorization, and trusted tenant context before resolving the target Enrollment.
