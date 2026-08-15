# LEGACY-STATUS-001 — Legacy to Canonical Mapping Matrix

## Canonical vocabulary

| Canonical value | Meaning | State-machine role |
|---|---|---|
| `applicant` | Registration exists and is awaiting admission decision | Initial state |
| `admitted` | Admission decision approved | Ordinary state |
| `active` | Student is actively enrolled | Ordinary state |
| `suspended` | Student is temporarily suspended | Ordinary state |
| `withdrawn` | Student has left or been permanently withdrawn | Ordinary state |
| `graduated` | Student completed the academic lifecycle | Ordinary state |
| `archived` | Historical terminal archive | Terminal state |

The approved ordinary sequence is:

`applicant → admitted → active → suspended → withdrawn → graduated → archived`.

## Mapping matrix

| Legacy value / operation | Source | Candidate canonical value | Safe without business decision? | Can reach DB today? | Fate |
|---|---|---|---|---|---|
| `applicant` | Legacy model and SOP-001 | `applicant` | Yes for SOP-001 | Yes only through SOP-001 | Preserve as canonical |
| `accepted` | `StudentLifecycleManager` | `admitted` | **No**; “accepted” may represent admission approval or enrollment approval | Legacy path can write only legacy student projection | Business contract gap |
| `enrolled` | `StudentLifecycle.ts`, `StudentAdmissionDomainService` | Usually `active` | **No**; enrollment status and academic status are not identical | Legacy direct writer | Business contract gap; Enrollment contract required |
| `re_enrolled` | `StudentLifecycleManager` | Possibly `active` | **No**; requires proof of a closed prior enrollment and a new enrollment record | Legacy direct writer | Enrollment contract required |
| `active` | Legacy services and legacy create | `active` | Only when a canonical academic-status row already exists and parity is proven | Legacy create currently bypasses canonical records | Preserve only as projection after cutover |
| `suspended` | Legacy dismiss operation | `suspended` | Only for temporary suspension with approved reason and effective date | Legacy direct writer currently skips canonical chain | Convert after operation contract |
| `dismissed` | `StudentLifecycleManager` and dismiss route | `withdrawn` or `suspended` | **No**; permanence is encoded by operation type, not the value alone | Legacy direct writer | Business contract gap; do not guess |
| `withdrawn` | Soft delete and legacy lifecycle | `withdrawn` | Only if withdrawal is approved and enrollment closure is represented | Legacy direct writer currently skips history/transition/outbox | Convert after withdrawal contract |
| `graduated` | Graduation services | `graduated` | Only with canonical current status, completion rules, and approval metadata | Legacy direct writer currently skips canonical chain | Convert after graduation contract |
| `archived` | Archive service | `archived` | Archive is canonical terminal state, but restore is forbidden by the approved state machine except correction workflow | Legacy direct writer | Convert archive; separate restore/correction contract |
| `inactive` | Legacy lifecycle manager | None proven | No | Legacy only | Do not map; business decision required |
| `frozen` | Legacy lifecycle manager | None proven | No | Legacy only | Do not map; business decision required |
| `on_leave` | Legacy model vocabulary | None proven | No | No confirmed status writer | Do not map; likely attendance/HR policy, not academic status |
| `transferred` | Student admission domain vocabulary | None; transfer is not a status | No | Legacy domain only | Remove from academic status contract; Enrollment contract required |

## Operation mapping

| Operation | Canonical transition candidate | Required evidence before implementation | Current decision |
|---|---|---|---|
| Registration | `NULL → applicant` plus initial transition/history | Existing SOP-001 evidence | Safe and already canonical |
| Admission approval | `applicant → admitted` | Permission, approval actor, admission reference | Not implemented by legacy path; contract required |
| Activation/enrollment | `admitted → active` | Enrollment/admission proof and academic context | Contract required |
| Temporary dismissal | `active → suspended` | Approved reason, effective date, authority | Contract required |
| Withdrawal | `suspended → withdrawn` under the current schema | Withdrawal reason, enrollment closure, no hidden financial semantics | Contract required |
| Graduation | `withdrawn → graduated` under the current approved machine | Graduation eligibility and approval | Contract required; current business meaning may conflict |
| Archive | `graduated → archived` | Retention/archival approval | Contract required |
| Transfer | No academic status change | Enrollment transfer record and target context | Must remain in Enrollment domain |
| Restore/re-enroll | No approved ordinary reverse transition | Correction or Enrollment contract | Reject mapping by default; do not guess |

## Decision

Only the SOP-001 initial `applicant` mapping is proven safe. All other legacy values require an explicit operation contract or data evidence. A direct string replacement would create incorrect history and potentially violate the database transition checks.
