# ENROLL-CONTRACT-002 — Approved Enrollment State Machine

Date: 2026-08-11  
Status: approved contract for subsequent implementation

## Enrollment states

| State | Meaning | Allowed predecessor | Allowed next state | Terminal? | Academic Status effect | Academic context |
|---|---|---|---|---|---|---|
| `draft` | Registration package started but not submitted/validated | none or command-specific draft creation | `pending`, `cancelled` | No | No change | Academic year/term must be identified before submission |
| `pending` | Real holding Enrollment awaiting admission/activation gate | `draft` or initial SOP-001 creation | `active`, `cancelled` | No | Student remains `applicant` or `admitted` | Year and term must be valid and tenant-scoped |
| `active` | Current approved placement | `pending` or approved transfer/re-enrollment creation | `completed`, `withdrawn`, `transferred`, `cancelled` only through approved correction | No | Academic Status must be `active` | One active Enrollment per student/year; no overlap |
| `completed` | Placement period ended normally | `active` | `archived` | Functionally closed | Does not imply `graduated` | `ends_on` and completion reason required |
| `withdrawn` | Placement ended by approved withdrawal | `active` | `archived` | Functionally closed | Academic Status becomes `withdrawn` in same operation | `ends_on` and withdrawal reason required |
| `transferred` | Source placement closed by approved first-class transfer | `active` | `archived` | Functionally closed | Destination operation determines resulting status | `enrollment_transfers` must reference source and destination |
| `cancelled` | Enrollment voided before activation or by approved correction | `draft` or `pending` | `archived` | Functionally closed | No automatic graduation/withdrawal effect | Must not be treated as active history |
| `archived` | Retained closed record after archive policy | closed states | none in normal flow | Yes | No change | Historical visibility only; no restore in normal flow |

## Required transition behavior

- Every transition is an explicit command with expected `version`.
- Every transition writes one `enrollment_history` row.
- Every transition writes central audit and outbox records in the same transaction.
- Direct status updates are not canonical.
- Correction of a terminal state requires the approved correction workflow and must not mutate history in place.

## Academic Status contract

| Enrollment event | Required Academic Status behavior |
|---|---|
| initial `pending` | `applicant` or `admitted`, according to admission workflow; never `active` automatically |
| activation | set/verify Academic Status `active` |
| withdrawal | set Academic Status `withdrawn` atomically |
| normal completion | no automatic graduation |
| graduation | Academic Status `graduated`; close active placement through graduation orchestration |
| transfer | preserve student academic lifecycle unless destination policy explicitly changes it; never use transfer as a Student Status value |
| re-enrollment | new Enrollment; Academic Status must satisfy admission/activation policy |

## Student lifecycle projection

`students.status` is a compatibility projection and not a writer-owned state machine. The canonical Academic Status is authoritative.
