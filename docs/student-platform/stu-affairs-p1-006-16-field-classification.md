# STU-AFFAIRS-P1-006-16 — Artifact Field Classification Matrix

## Classification levels

- **PUBLIC** — safe for broad institutional display after scope validation.
- **INTERNAL** — operational school information for authorized staff.
- **CONFIDENTIAL** — student or guardian information requiring role and scope control.
- **RESTRICTED** — identity, academic, financial, or contact data requiring an explicit field profile.
- **HIGHLY_CONFIDENTIAL** — regulated or high-impact data; default deny in general reports.

## Field matrix

| Field group | Classification | Student Export | Official List | Browser Print | ID Card | Enrollment Certificate | Academic Transcript | Financial Statement |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| School name / approved branding | INTERNAL | Allow | Allow | Display only | Allow | Allow | Allow | Allow |
| Branch name/code | INTERNAL | Allow if operationally required | Allow if approved | Display only | Allow if approved | Allow if approved | Allow if approved | Finance decision |
| Student number | INTERNAL | Allow | Allow | Current view only | Allow | Allow | Allow | Finance decision |
| Student full name | CONFIDENTIAL | Allow | Allow | Current view only | Allow | Allow | Allow | Finance decision |
| Student photograph | RESTRICTED | Exclude by default | Owner decision | Current profile only | Owner decision | Exclude by default | Exclude | Finance decision |
| National ID | HIGHLY_CONFIDENTIAL | Exclude | Exclude by default | Current profile may expose it; not approved for print | Exclude by default | Exclude | Exclude | Exclude |
| Date of birth | RESTRICTED | Exclude in current export | Owner decision | Current profile only | Exclude | Owner decision | Owner decision | Finance decision |
| Gender / nationality | CONFIDENTIAL | Exclude by default | Owner decision | Current view only | Owner decision | Owner decision | Owner decision | Finance decision |
| Guardian name | CONFIDENTIAL | Excluded from canonical export | Owner decision | Current print currently includes it; not approved | Exclude by default | Owner decision | Exclude | Finance decision |
| Guardian phone | HIGHLY_CONFIDENTIAL | Excluded from canonical export | Exclude by default | Current print currently includes it; security finding | Exclude | Exclude | Exclude | Finance decision |
| Address | HIGHLY_CONFIDENTIAL | Exclude | Exclude | Exclude | Exclude | Owner decision | Exclude | Finance decision |
| Academic year / term | INTERNAL | Allow if approved | Allow | Current view only | Owner decision | Allow if approved | Required after Results approval | Finance decision |
| Grade / class / section | INTERNAL | Allow | Allow | Current view only | Allow if approved | Owner decision | Allow if approved | Finance decision |
| Enrollment status | CONFIDENTIAL | Allow operational status | Allow if approved | Current view only | Owner decision | Allow if approved | Required after source approval | Finance decision |
| Grades / GPA / transcript lines | RESTRICTED | Exclude | Exclude | Exclude | Exclude | Exclude | Blocked until authoritative source | Finance decision |
| Attendance summary | RESTRICTED | Exclude | Owner decision | Exclude | Exclude | Owner decision | Owner decision | Finance decision |
| Medical data | HIGHLY_CONFIDENTIAL | Exclude | Exclude | Exclude | Exclude | Exclude | Exclude | Exclude |
| Fees / balances / payments | HIGHLY_CONFIDENTIAL | Exclude | Exclude | Exclude | Exclude | Exclude | Exclude | Finance-owned only |
| Audit/request/correlation identifiers | INTERNAL | Server metadata only | Server metadata only | Not client authority | Server metadata only | Server metadata only | Server metadata only | Finance-owned |

## Mandatory field-profile rules

1. No report inherits fields from the Student screen automatically.
2. A field marked Exclude is denied unless a later owner/security decision changes the profile.
3. Highly confidential fields require an explicit artifact-specific approval and must not appear in general lists, cards, certificates, or browser print.
4. Guardian phone, national ID, address, medical, and financial values must never be copied into audit metadata.
5. The current browser print inclusion of guardian phone is a defect in the proposed official-report interpretation; this contract authorizes no code change.

