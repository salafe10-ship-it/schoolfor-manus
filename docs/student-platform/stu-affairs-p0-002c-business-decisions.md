# STU-AFFAIRS-P0-002C — Business Decisions

## Approved by Existing Contracts

The following are already established by ENROLL-CONTRACT-002 and must not be changed silently:

1. Enrollment and Academic Status are linked aggregates with atomic application behavior.
2. `students.status` is a compatibility projection, not the canonical lifecycle writer.
3. Branch, school-within-tenant, academic-year or term ownership changes are first-class Enrollment Transfers.
4. Class/section changes inside the same Enrollment are placement edits, not automatically transfers.
5. First-class transfer closes the source Enrollment, creates a destination Enrollment and writes transfer/history/audit/outbox effects together.
6. No historical Enrollment is reopened.
7. No client-selected tenant, school, branch, academic year or term is trusted.

## Business Decision Required

| Decision | Why it matters |
|---|---|
| Is the current UI action a Placement Edit, Enrollment Transfer, or two separate actions? | Determines the persisted aggregate and history. |
| Are cross-branch transfers allowed? | Determines destination validation and authorization. |
| Are school-within-tenant transfers allowed? | Determines source/destination school rules. |
| Are academic-year/term changes allowed in one batch? | Determines Enrollment creation and overlap rules. |
| Is placement history mandatory for class/section edits? | Determines a missing domain record/contract. |
| Can a batch contain students from multiple branches? | Determines preflight scope and permission. |
| Should one invalid student reject the entire batch? | Contract currently recommends yes; owner confirmation required. |
| Is `Student.Write` sufficient? | A dedicated Transfer permission may be safer, but cannot be added here. |
| Which approval level is required for cross-scope moves? | Needed before a command can be accepted. |
| What is the effective date rule? | Needed for Enrollment overlap and history. |

## Recommended Defaults (Not Approved)

- All-or-nothing for every batch.
- No mixed command types in one batch.
- Same-Enrollment class/section operation is Placement Edit.
- Cross-branch/school/year/term operation is Enrollment Transfer.
- Mixed source scope is rejected unless explicitly approved by policy.
- A cross-scope destination must be validated from trusted context and approved policy.

## Owner Gate

Any item marked **Business Decision Required** must be approved by the owner/CTO before implementation. Engineering must not infer a business answer from the current UI labels or legacy fields.

## Decision

**BUSINESS DECISION REQUIRED — NO IMPLEMENTATION.**
