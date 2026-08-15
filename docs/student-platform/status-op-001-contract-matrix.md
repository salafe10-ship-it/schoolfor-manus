# STATUS-OP-001 — Operation Contract Matrix

## Purpose

This is a discovery-only contract matrix for the four legacy operations that can change Student Status. It records what the current code actually proves. It does not approve new business rules and does not authorize implementation.

## Current evidence matrix

| Operation | Current legacy state(s) | Current preconditions | Current target/write | Canonical target | Required reason | Side effects | Reversible? | Contract decision |
|---|---|---|---|---|---|---|---|---|
| Graduate | `active` is the normal path; `suspended` is not accepted by `StudentLifecycleManager` | Student exists; `feesRemaining` must be zero; legacy transition validator passes | `students.status = graduated`; audit log; in-memory graduate registry object | Current canonical DB machine only permits `withdrawn → graduated` | Not required by the legacy service; business reason is not persisted in canonical records | Locks legacy edits; no real graduate table write; audit log only | No ordinary reverse transition; archive is the only next canonical step | **BUSINESS DECISION REQUIRED** |
| Dismiss | `active`, sometimes `suspended`; operation type selects temporary/permanent | Student exists; legacy validator passes; reason, decision number, authority, date are accepted | Temporary: `students.status = suspended`; permanent: `students.status = dismissed`; behavior notes; audit | Temporary candidate: `active → suspended`; permanent has no proven canonical equivalent | Reason and authority exist in request, but canonical persistence contract is absent | Behavior notes and audit; no canonical history/transition/outbox | Temporary reversal is not defined by canonical machine; permanent reversal is not defined | **BUSINESS DECISION REQUIRED** |
| Archive | Any legacy state for which `StudentLifecycleManager` permits `→ archived`; restore validates `→ inactive` then writes `active` | Student exists; legacy validator passes | Archive: `students.status = archived`; restore: `students.status = active`; audit | Archive candidate: `graduated → archived`; restore is not an ordinary canonical transition | No explicit archive reason or retention decision | Legacy archive/restore audit only | Archive is terminal in the approved machine; restore requires correction workflow | **BUSINESS DECISION REQUIRED** |
| Re-enroll | `suspended` is the intended legacy source; validator targets `re_enrolled` | Student exists; classroom and section provided | Writes `students.status = active`, classroom, section, registration date; audit | No approved ordinary reverse transition; likely requires a new Enrollment contract | No explicit re-enrollment reason or approval in the legacy method | New class/section and registration date; audit only | Not defined; previous history and enrollment are not represented | **BUSINESS DECISION REQUIRED** |

## Required canonical sequence once contracts are approved

`Request → trusted identity → authorization → trusted tenant context → load current canonical status → validate operation contract → existing UnitOfWork → update canonical status + projection → transition → immutable history → audit → outbox → commit`.

The current legacy implementations do not provide this sequence. They must not be considered converted until each row above has an approved target, permission, reason, side-effect, and reversibility policy.

## Missing business decisions

1. Is graduation allowed directly from `active`, or must Enrollment close first so the canonical `withdrawn → graduated` sequence is respected?
2. Is permanent dismissal equivalent to withdrawal, a correction, or a separate non-academic business outcome?
3. Is temporary dismissal exactly academic suspension, and what operation reactivates it?
4. Is archive a retention state only, or does it change academic status? What retention/restore policy applies?
5. Does re-enrollment create a new Enrollment and academic-year relationship? Which source states are permitted?
6. Which operation-specific permissions are required? The current broad `Student.Write` route permission is not sufficient evidence.
7. Which financial, attendance, examination, and enrollment side effects are mandatory and in what order?

## Matrix decision

`STATUS-OP-001 = BUSINESS DECISION REQUIRED`.
