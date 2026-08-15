# ATTEND-CONTRACT-001 — State Model

## Status

`BUSINESS DECISION REQUIRED`

No implementation state machine is authorized by this document.

## Current code vocabulary (not approved)

- Student legacy model: `present`, `absent`, `excused`.
- Employee model: `present`, `absent`, `late`, `excused`.
- The two vocabularies belong to different domains and must not be merged.

## Required state decisions

The business owner must define:

1. The complete canonical state list.
2. Whether `late` is an attendance state, an arrival attribute, or both.
3. Whether an excuse is a state or an approval attached to an absence.
4. Whether a recorded state can be corrected before approval.
5. Whether an approved state is locked.
6. Whether an administrator can override a lock and what evidence is mandatory.
7. Whether a cancelled/voided record is retained historically.

## Transition matrix template

| From | To | Allowed? | Actor | Reason required? | Approval required? | Lock rule |
|---|---|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` | `TBD` |

No transition is inferred from the current repository or HR screen. In particular, `present → absent`, `absent → excused`, and post-lock corrections require explicit business approval.

## Terminal and lock behavior

Terminal/locked states, correction windows, and historical retention are all `TBD`. No delete, overwrite, or automatic transition is authorized.
