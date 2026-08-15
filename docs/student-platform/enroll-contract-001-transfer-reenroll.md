# ENROLL-CONTRACT-001 — Transfer and Re-enrollment Contract

Date: 2026-08-11  
Mode: contract discovery only; no implementation

## Transfer evidence

### Current live behavior

`POST /api/students/:id/transfer` calls `StudentEnrollmentService.transferStudent`.

The service may update legacy student fields for:

- classroom;
- section;
- stage;
- branch.

It returns an in-memory movement log and writes to legacy audit. It does not write `enrollment_transfers`, `enrollment_history`, a source Enrollment closure, or a destination Enrollment.

### Schema capability

`enrollment_transfers` supports:

- source and destination schools/branches;
- source Enrollment and optional destination Enrollment;
- requested, approved and completed timestamps/actors;
- idempotency;
- transfer status and reason;
- tenant-scoped references.

The schema therefore supports a first-class transfer process, but the application has not selected its business semantics.

### Open transfer decision

The repository cannot prove whether Transfer means:

1. class/section reassignment within the same Enrollment;
2. branch transfer within one school;
3. school transfer within one tenant;
4. academic-year movement;
5. close old Enrollment + create new Enrollment;
6. an independent process that may result in one of the above.

Recommended enterprise interpretation: only a placement change that crosses a branch/school or changes the Enrollment period should become a first-class transfer; class/section assignment needs an explicit placement ownership decision. This recommendation requires CTO/business approval.

## Re-enrollment evidence

`POST /api/students/:id/re-enroll` calls `StudentEnrollmentService.reEnrollStudent`.

The service:

- reads the legacy Student record;
- validates a legacy lifecycle transition;
- updates the legacy Student to `active`;
- changes class/section and registration date;
- writes legacy audit.

It does not create/reopen an Enrollment, write Enrollment history, validate canonical academic year/term, or publish an Enrollment event.

## Open re-enrollment decision

The source does not establish whether Re-enrollment:

- creates a new Enrollment for a new academic year;
- reopens a previous Enrollment;
- closes the previous period and creates a new period;
- changes Academic Status;
- is distinct from Transfer;
- is allowed after withdrawal, suspension, completion or archive.

Recommended enterprise interpretation: Re-enrollment should create a new Enrollment period and preserve the old history; it should not mutate an old historical period. This remains a proposed policy, not an implemented fact.

## Legacy writer disposition

| Writer | Evidence-based disposition now | Reason |
|---|---|---|
| `/api/students/:id/transfer` | BLOCK pending contract | It currently bypasses canonical Enrollment aggregates |
| `/api/students/:id/re-enroll` | BLOCK pending contract | It mutates legacy Student lifecycle without Enrollment history |
| bulk operations | BLOCK pending contract | Operation-specific canonical mapping is not proven |
| SOP-001 initial registration | KEEP as current canonical seed path | It is the only proven atomic Enrollment writer |

No deprecation, conversion or replacement is implemented in this mission.
