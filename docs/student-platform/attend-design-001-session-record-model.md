# ATTEND-DESIGN-001 — Session and Record Model

## Session lifecycle

```text
OPEN ──lock──> LOCKED
```

- A session is created for an approved academic occurrence.
- Records may be created or corrected under the approved open-session policy.
- After `LOCKED`, ordinary updates and deletes are forbidden.
- There is no general unlock operation. Any exceptional administrative correction uses the correction workflow and elevated permission.

## Record states

- `present`: student attended the session.
- `absent`: student did not attend.
- `late`: student attended after the approved session threshold.
- `excused`: absence was authorized under school policy.

`late` is not absence, and `excused` is not an invisible `absent` value.

## Eligibility

The write path must validate:

1. Trusted tenant, school, branch, actor, and role context.
2. Student exists in that same scope.
3. Enrollment exists, is valid, and covers the session’s academic year and term.
4. Enrollment school/branch/class context is compatible with the session.
5. Academic Status and lifecycle rules do not make the student ineligible.

Admission alone never creates an attendance record.

## Uniqueness and idempotency

The logical invariant is exactly one record for:

`student_id + attendance_session_id`

Bulk retries must return or reconcile the existing logical record rather than creating a second record. A request/idempotency key is required for replayable bulk operations.

## Correction model

Correction is a controlled operation, not a silent update. It records the prior state, new state, reason, actor, server timestamp, request/correlation metadata, and audit event. A locked session rejects ordinary correction and requires the elevated correction path.
