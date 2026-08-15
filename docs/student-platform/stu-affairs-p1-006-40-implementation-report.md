# STU-AFFAIRS-P1-006-40 — Canonical Student Timeline Source Fix

## Decision

`STU-AFFAIRS-P1-006-39 = NEXT BOUNDED FIX IDENTIFIED — APPROVED` was received from the consultant. This implementation is limited to the Student Timeline read path.

## Root cause

The timeline endpoint read the legacy `audit_logs` repository and identified events with `affectedRecord` or free-text `details`. Canonical Student writes record structured events in `public.audit_events`, so successful operations could be missing from the timeline.

## Implementation

- Added `CanonicalStudentTimelineRepository`.
- Reads only `public.audit_events`.
- Filters by trusted `tenantId`, `schoolId`, `branchId`, `entity_type = 'student'`, `entity_id`, and successful result.
- Uses deterministic `created_at DESC, id DESC` ordering.
- Does not use free-text identity matching.
- Preserves the existing timeline response shape.
- Database failures propagate as errors; they are not converted to an empty list.
- The existing authentication, Student read permission, and trusted tenant middleware remain unchanged and execute before the reader.

## Files modified

- `server.ts`
- `src/database/repositories/CanonicalStudentTimelineRepository.ts`
- `src/__tests__/stuAffairsP1TimelineCanonical.test.ts`

No audit writer, schema, migration, RLS, authorization, tenant engine, export, print, lifecycle, or staging/production code was changed.

## Result

`P1-006-40 = CODE-LEVEL CLOSED — CANONICAL STUDENT TIMELINE`, subject to consultant review of the validation evidence.
