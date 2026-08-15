# STU-AFFAIRS-P1-006-30 — Domain/API Dependency Record

Status: `OPEN — DECISION REQUIRED BEFORE BOUNDED FIX`

## `birthCountryCode`

- Owner: Student canonical record.
- Database source: `students.birth_country_code`.
- Create: supported and validated as an uppercase two-character code.
- Edit: not supported by the current Student Profile patch contract.
- Read: not selected by the current canonical Student read query/projection.
- Decision required: expose it read-only, or approve a full Read+Edit contract with validation, optimistic version, audit, and response parity.

## `preferredName`

- Owner: Student canonical record.
- Database source: `students.preferred_name`.
- Create: supported by the canonical registration command.
- Edit: patch capability exists.
- Read: canonical mapper supports it.
- Profile UI: not exposed by the inspected Student Affairs Profile form.
- Decision required: approve bounded UI parity, or explicitly keep it API-only.

## Dependencies not included

- No Student contact schema decision.
- No National ID/document decision.
- No Enrollment placement decision.
- No Academic Status decision.
- No Authorization or TenantEngine decision.

## Gate

Until the owner chooses the exact read/edit behavior for the two parity gaps, no mapping, API change, repository change, or UI addition is authorized.
