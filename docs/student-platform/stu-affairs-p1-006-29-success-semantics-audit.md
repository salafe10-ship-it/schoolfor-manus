# STU-AFFAIRS-P1-006-29 — Success Semantics Audit

Status: `AUDITED — P1-006-28 PROFILE MESSAGE CORRECTED`

## Create

The canonical registration response represents a committed registration workflow and includes workflow metadata such as student, guardian, enrollment, status, audit, outbox, request, and correlation references. The Student Profile UI now avoids claiming that unsupported legacy form fields were persisted.

## Edit

The canonical update response represents a committed Student row update with optimistic versioning and an audit event. It does not mean that Enrollment placement, Academic Status, Guardian email, Student contact data, national ID, or other domain-owned fields were changed.

## Read

The Student Profile read model projects canonical Student identity plus selected Enrollment and Guardian projections. It does not currently project `birthCountryCode`, Student contact fields, religion, national ID, or Guardian email. Missing values must remain “not recorded,” not be replaced with synthetic values.

## Finding

`P1-006-28` corrected the broad UI success wording. The remaining difference between Create and Edit is workflow semantics and read-model coverage, not permission to silently add mappings.

## Required future approval

Any parity fix must specify whether it is:

- a read projection change;
- a Student canonical update contract change;
- a Guardian contract change;
- an Enrollment/Academic Status change; or
- an audit/outbox policy change.

No such change is implemented by P1-006-29.
