-- ENROLL-SCHEMA-ALIGN-001
-- Align the approved Enrollment withdrawal contract with Academic Status.
-- Scope: add exactly active -> withdrawn to the existing ordinary transition set.
-- No other state, table, RLS, role, function or business rule is changed here.

BEGIN;

ALTER TABLE student_status_transitions
    DROP CONSTRAINT IF EXISTS ck_student_status_transitions_allowed;

ALTER TABLE student_status_transitions
    ADD CONSTRAINT ck_student_status_transitions_allowed CHECK (
        (
            transition_kind = 'initial'
            AND from_status IS NULL
            AND to_status = 'applicant'
        )
        OR (
            transition_kind = 'ordinary'
            AND (
                (from_status = 'applicant' AND to_status = 'admitted')
                OR (from_status = 'admitted' AND to_status = 'active')
                OR (from_status = 'active' AND to_status = 'suspended')
                OR (from_status = 'active' AND to_status = 'withdrawn')
                OR (from_status = 'suspended' AND to_status = 'withdrawn')
                OR (from_status = 'withdrawn' AND to_status = 'graduated')
                OR (from_status = 'graduated' AND to_status = 'archived')
            )
        )
        OR (
            transition_kind = 'correction'
            AND correction_reference IS NOT NULL
            AND length(btrim(correction_reference)) > 0
            AND approval_status IN ('approved', 'completed')
        )
    );

COMMIT;
