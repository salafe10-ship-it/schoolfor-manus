# STU-AFFAIRS-P0-002H — Transfer Scope Decision

## Decision status

`BUSINESS DECISION REQUIRED`. No approved source document or current implementation provides these policies. No policy is inferred from legacy field names.

## Required owner decisions

| Scope change | Current decision |
|---|---|
| Branch → Branch within one school | UNDECIDED |
| School → School within one tenant | UNDECIDED |
| Academic Year → Year | UNDECIDED |
| Term → Term | UNDECIDED |
| More than one scope change in one command | UNDECIDED |
| Multiple destinations in one batch | UNDECIDED |
| Must every item share one source/destination context? | UNDECIDED |

## Safe behavior until approval

All first-class transfer commands remain blocked at validation. A missing policy must not be interpreted as permission. Same-Enrollment class/section changes remain a separate Placement Edit and must not be silently converted into Transfer.

## Required output of the business decision

The owner must approve an explicit matrix covering source/destination scope, mixed destinations, academic-year/term rules, approval authority, and whether cross-school movement is intra-tenant or a separate admission process.

## Non-goals

This document does not create or alter Enrollment records, permissions, migrations, RLS, APIs, or UI.
