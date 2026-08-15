# STU-AFFAIRS-P1-006-34 — Birth Country Canonical API Contract

## Status

`P1-006-34 = API CONTRACT READY FOR IMPLEMENTATION`

This is an architecture/API contract only. It does not modify `server.ts`, repositories, UI, database, migrations, RLS, authorization, export, or reporting.

## Canonical source and read

- Canonical source: `public.students.birth_country_code`.
- Read projection member: `birthCountryCode`.
- Serialization: `string | null`; JSON `null` means the value is not recorded.
- No fallback, derivation, or client-provided replacement is permitted.
- Read scope: the existing authenticated Student read permission and trusted tenant/school/branch context used by the canonical Student read path.
- Response shape: the existing canonical Student object includes `birthCountryCode` alongside its other Student Profile fields, with the persisted `version`.

## Patch member

The canonical Student patch contract adds one optional member:

```text
birthCountryCode?: string | null
```

Semantics:

- member absent: do not change the field;
- member present with `null`: clear the field, subject to correction policy;
- member present with text: trim, uppercase, then validate;
- empty/whitespace text normalizes to explicit `null` only when the correction policy permits a clear; otherwise reject as invalid input.

Validation:

- exactly two ASCII letters after normalization;
- semantic membership in the approved ISO 3166-1 alpha-2 reference source;
- invalid syntax or unsupported code uses the existing `VALIDATION_ERROR` contract and performs no write.

## Required update envelope

For an update that includes `birthCountryCode`:

```text
studentId
birthCountryCode?: string | null
expectedVersion: integer >= 1
correctionReason?: string
```

`studentId`, tenant, school, branch, actor, timestamps, request ID, and correlation ID are resolved or validated by the trusted server path. Tenant identity is never accepted from the request body.

## Correction rules

| Previous value | Requested value | `correctionReason` |
|---|---|---|
| `null` | valid code | optional |
| `null` | `null` | no-op; no write required |
| existing code | same normalized code | no-op; no write required |
| existing code | different valid code | required |
| existing code | `null` | required |

Reason is trimmed, must be 10–500 characters when required, and is owned/validated by the API/domain boundary. The audit layer records the validated reason; it does not accept actor, tenant, time, or version values from the client.

## Success and errors

- Success is returned only after the canonical transaction commits and the response contains the persisted canonical projection and resulting version.
- Validation failures use existing `VALIDATION_ERROR` (HTTP 400).
- Stale `expectedVersion` uses existing `CONFLICT_ERROR` (HTTP 409), with no success response.
- Authentication, authorization, tenant, or branch failures use the existing platform error semantics and do not write.
- Persistence failure returns failure and rolls back the field and audit event together.
