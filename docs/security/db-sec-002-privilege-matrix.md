# DB-SEC-002 — Staging Privilege Matrix

## Role

`edupro_staging_app` is the dedicated Staging application role. It is non-superuser, non-owner, non-bypass, cannot create databases or roles, and has no administrative role membership.

## Explicit grants

| Table | SELECT | INSERT | UPDATE | DELETE | Reason |
|---|---:|---:|---:|---:|---|
| `tenants` | Yes | No | No | No | Registration-side tenant reference and FK scope |
| `users` | Yes | No | No | No | Resolve authenticated internal actor |
| `academic_years` | Yes | No | No | No | Validate trusted academic context |
| `terms` | Yes | No | No | No | Validate trusted term context |
| `students` | Yes | Yes | Yes | Yes | Registration and existing Student transaction path |
| `guardians` | Yes | Yes | Yes | Yes | Guardian resolution and lifecycle writes |
| `student_guardians` | Yes | Yes | Yes | Yes | Guardian link writes |
| `enrollments` | Yes | Yes | Yes | Yes | Enrollment creation and lifecycle transactions |
| `student_academic_status` | Yes | Yes | Yes | Yes | Academic status creation and lifecycle transactions |
| `student_status_transitions` | Yes | Yes | Yes | Yes | Transition creation and lifecycle transactions |
| `student_status_history` | Yes | Yes | Yes | Yes | History creation and lifecycle transactions |
| `audit_events` | Yes | Yes | No | No | Idempotency/audit reference and append-only insertion |
| `outbox_events` | Yes | Yes | Yes | No | Idempotency lookup and queue state updates |

Schema privilege: `USAGE` on `public` only. No blanket table grant, ownership grant, role grant, database CREATE, schema CREATE, or sequence grant was added.

## Deliberate exclusions

Student document tables and unrelated Finance, HR, Inventory, Examination, and other module tables were not granted to the direct transaction role because the reviewed Student Registration transaction path does not access them. Their client-side Supabase paths remain a separate RLS scope and must be included in DB-SEC-003 policy coverage before certification.

## Validation

- `rolsuper=false`
- `rolbypassrls=false`
- `rolcreatedb=false`
- `rolcreaterole=false`
- No role membership
- Protected/reference table owners remain `postgres`
- `audit_events` UPDATE/DELETE denied
- Public schema CREATE denied
- Forbidden DDL probe denied

RLS status: **PENDING DB-SEC-003**.
