# STU-AFFAIRS-P1-006-21 — P0 Trigger Evidence

## Rule

The consultant order required an immediate P0 stop only if static evidence proved one of:

- cross-tenant mutation;
- unauthorized lifecycle mutation;
- fabricated success;
- mutation after failed authorization;
- destructive write without scope;
- a lifecycle mutation that can bypass the Graduation containment.

## Evidence review

| Trigger | Evidence status | Determination |
|---|---|---|
| Cross-tenant mutation | NOT PROVEN | Route tenant middleware and legacy `school_id` predicates are visible; the bulk route requires a separate containment decision, but no execution evidence exists. |
| Unauthorized lifecycle mutation | NOT PROVEN | Active routes require authentication and `Student.Write`; the exact permission model is not re-designed in this discovery mission. |
| Fabricated success | NOT PROVEN IN THIS AUDIT | The graduation route remains explicitly fail-closed with `GRADUATION_NOT_READY`. No new success-after-failure execution was run. |
| Mutation after failed authorization | NOT PROVEN | No runtime request was executed. |
| Destructive write without scope | NOT PROVEN | The canonical DELETE route resolves tenant context; legacy bulk/delete scope is a containment concern, not an executed finding. |
| Graduation bypass | NOT PROVEN | The active graduation API route remains blocked; no alternative production caller was found in the route search. |

## Decision

`P1-006-21 = LEGACY WRITERS REACHABILITY PROVEN — DOMAIN CONTAINMENT REQUIRED`

The result is P1/domain-gated rather than the ordered P0 stop condition. No source, database, migration, RLS, authorization, or deployment file was changed.

## Required next governance decision

Approve one canonical lifecycle writer and explicitly classify or contain the active Legacy API routes and bulk endpoint before remediation. The decision must also define the scope of any future source modification.

