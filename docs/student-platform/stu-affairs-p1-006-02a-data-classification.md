# STU-AFFAIRS-P1-006-02A — Export Data Classification

## Purpose

Define the security questions for fields currently emitted by the legacy browser CSV. This is a decision aid, not an authorization grant.

## Classification matrix

| Field | Current legacy export | Provisional classification | Default future treatment | Approval status |
| --- | --- | --- | --- | --- |
| Student number / academic ID | Included | CONFIDENTIAL operational identifier | Include only in approved operational profile | **UNDECIDED** |
| Student name | Included | CONFIDENTIAL personal data | Include in standard operational profile | **UNDECIDED** |
| National ID | Included | RESTRICTED / HIGHLY CONFIDENTIAL identity data | Exclude by default; masked or role-approved profile only | **UNDECIDED** |
| Classroom | Included | INTERNAL operational data | Include when required by the approved scope | **UNDECIDED** |
| Section | Included | INTERNAL operational data | Include when required by the approved scope | **UNDECIDED** |
| Guardian name | Included | CONFIDENTIAL personal data | Exclude by default unless operational use is approved | **UNDECIDED** |
| Guardian phone | Included | RESTRICTED personal contact data | Exclude or mask by default; explicit profile required | **UNDECIDED** |
| Student status | Included | INTERNAL operational data | Include in standard profile if business-approved | **UNDECIDED** |

## Rules proposed for approval

1. A base export permission must not expose all fields automatically.
2. Restricted fields require an explicit field profile, owner, and audit evidence.
3. Masking must be deterministic and documented; partial masking must not be mistaken for anonymization.
4. Audit records must record the profile and field categories, not raw values.
5. Download artifacts must be protected while retained and deleted at expiry.
6. Export data must not be copied to browser local storage or application logs.
7. Legal/compliance retention requirements override convenience deletion only when formally recorded.

## Data minimization questions

The decision owner must answer:

- Is national ID needed for any standard Student Affairs export?
- Is guardian phone needed, and for which role/use case?
- Is a separate safeguarding or admissions profile required?
- Are masked fields commercially sufficient?
- Are exported files allowed to leave the school operator’s controlled environment?
- What is the retention period and who can revoke access?

## Decision boundary

Until these questions are answered, the safe default is to exclude national ID and guardian phone from any future production export. This document does not change the existing legacy behavior; it prevents that behavior from being treated as an approved target design.

