# STU-AFFAIRS-P1-PRIV-008 — Student Sensitive Data Exposure Audit

## Scope

The audit followed:

`Student data → canonical API response/projection → StudentRepository → StudentAffairsPortal → visible field`

The target fields were National ID and Guardian Phone. Export was reviewed as a separate contract and was not modified.

## Evidence

- The canonical Student read projection contains the values needed by the application, including `national_id` and `parent_phone`.
- The active Student Affairs list displayed National ID below the student name and Guardian Phone beside the guardian name.
- The Guardian summary cards displayed Guardian Phone.
- The profile details view displayed both National ID and Guardian Phone.
- The browser print list included Guardian Phone.
- The registration/edit form still needs these values for controlled data entry and canonical Guardian update validation; those inputs were not removed.

## Remediation

Only `StudentAffairsPortal.tsx` was changed:

- Removed National ID from the active student list and profile details view.
- Removed Guardian Phone from the active student list, Guardian summary cards, profile details view, and browser print list.
- Left canonical API projection, database, Export, RLS, and permissions unchanged.
- Kept controlled edit-form inputs because removing them would break authorized data entry/update flows.

## Security decision

This implements Least Exposure at the active Student Affairs presentation layer without deleting data or changing the source of truth. No client-side fallback reintroduces the sensitive values into the reviewed display surfaces.

`STU-AFFAIRS-P1-PRIV-008 = CODE-LEVEL CLOSED`
