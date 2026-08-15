# STU-AFFAIRS-P0-002I — Legacy to Canonical Enrollment Mapping

## Decision status

`STOP + BUSINESS/ARCHITECTURE DECISION REQUIRED`. The current data path does not prove a safe mapping.

## Field comparison

| Legacy field/path | Canonical Enrollment candidate | Result |
|---|---|---|
| `student.id` | `enrollments.student_id` | Candidate only; active Enrollment must be resolved in trusted scope |
| `schoolId` route/service argument | `enrollments.school_id` / `tenant_id` | Not trusted; must be server-derived from TenantContext |
| `branchId` request field | `enrollments.branch_id` | Candidate only; destination must be validated against trusted policy |
| `classroom` / target grade | `class_reference` | Semantic mapping not approved; may be Placement Edit, not Transfer |
| `section` / target section | `section_reference` | Semantic mapping not approved; same-Enrollment change is Placement Edit |
| `stageId` | No direct Enrollment column proven | Unmapped; requires domain owner decision |
| absent academic year | `academic_year_id` | Required canonical context is missing |
| absent term | `term_id` | Required canonical context is missing |
| absent source Enrollment ID | `from_enrollment_id` | Cannot safely infer from student alone |
| absent destination Enrollment data | `to_enrollment_id` | Cannot create canonical transfer |
| absent transfer reason | `transfer_reason` | Required business field is missing |
| absent idempotency key | batch operation key | Required reliability field is missing |

## Conclusion

The current Student Affairs UI/API payload (`studentId`, class/section/stage and optional branch) cannot be transformed into a canonical Enrollment Transfer by aliases or name matching. A server-side lookup must resolve the active Enrollment and trusted academic context, and the business contract must define whether the requested change is a Placement Edit or Transfer.

## Safe rule

Reject canonical transfer when any required mapping is absent or ambiguous. Do not mutate `students.classroom`, `students.section`, `students.stage_id`, or `students.branch_id` as a substitute for Enrollment state.
