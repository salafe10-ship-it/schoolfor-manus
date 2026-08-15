# STU-AFFAIRS-P1-006-14 — Security and Authorization Gap Audit

Status: `STOP — SECURITY/AUTHORIZATION DECISION REQUIRED`

## Scope

Read-only audit of Student Affairs authentication, permissions, tenant context, target scope, business authorization, and false-success exposure. No authorization, tenant, API, database, RLS, or UI changes were made.

## Operation findings

| Operation | Authentication | Permission | Tenant/scope | Assessment |
|---|---|---|---|---|
| Student read | `authenticateRequest` | `Student.View` via authorization-only middleware | Handler resolves trusted context inside request flow | `PROVEN / PARTIAL` |
| Student export | `authenticateRequest` | `Student.Export` | Explicit trusted context and bounded filters | `PROVEN` |
| Student create/update | `authenticateRequest` | `Student.Write` | Trusted context; canonical write path for supported fields | `PARTIAL / OVER-PERMISSIVE` |
| Student registration | `authenticateRequest` | `Student.Registration.Create` | Trusted context, idempotency, server audit metadata | `PROVEN` |
| Guardian update | `authenticateRequest` | `Student.Write` | Trusted context and canonical guardian service | `PARTIAL / OVER-PERMISSIVE` |
| Student delete/restore | `authenticateRequest` | `Student.Delete` | Trusted context; physical delete rejected | `PROVEN / ACTIONS SHARED` |
| Student documents view | `authenticateRequest` | `StudentDocument.View` | Middleware and document context | `PROVEN` |
| Student documents create/version | `authenticateRequest` | `StudentDocument.Create` / `StudentDocument.Version.Create` | Middleware and document context | `PROVEN` |
| Student document verify/archive/access log | `authenticateRequest` | Dedicated document permission | Middleware and document context | `PROVEN` |
| Student timeline | `authenticateRequest` | `Student.View` | Middleware and student scope | `PROVEN / NO TIMELINE-SPECIFIC PERMISSION` |
| Transfer | `authenticateRequest` | `Student.Write` | Middleware present; legacy service contract remains incomplete | `OVER-PERMISSIVE / DOMAIN BLOCKED` |
| Promote | `authenticateRequest` | `Student.Write` | Middleware present; legacy academic year behavior audited separately | `OVER-PERMISSIVE` |
| Re-enroll | `authenticateRequest` | `Student.Write` | Middleware present; operation-specific approval not proven | `OVER-PERMISSIVE` |
| Graduate | `authenticateRequest` | `Student.Write` | Middleware present; graduation integrity is blocked | `P0 DOMAIN BLOCKED / OVER-PERMISSIVE` |
| Dismiss/suspend | `authenticateRequest` | `Student.Write` | Middleware present; operation-specific approval not proven | `OVER-PERMISSIVE` |
| Archive/restore | `authenticateRequest` | `Student.Write` | Middleware present; two lifecycle paths exist | `OVER-PERMISSIVE / PATH DUPLICATION` |
| Bulk operations | `authenticateRequest` | `Student.Write` | Route accepts operation/items; target authorization is not operation-specific | `P1 OVER-PERMISSIVE` |

## Top security and authorization findings

| ID | Severity | Finding | Classification |
|---|---|---|---|
| AUTH-01 | P1 | One `Student.Write` permission covers promote, re-enroll, graduate, dismiss, suspend, archive, restore, transfer, and bulk operations | `SECURITY DECISION / CODE FIX` |
| AUTH-02 | P0 | Graduation is callable with broad Student.Write while its domain data is fabricated and canonical source is absent | `DOMAIN + SECURITY DECISION` |
| AUTH-03 | P1 | Guardian update uses Student.Write instead of the registered Guardian-specific permission | `CODE FIX / AUTHORIZATION DECISION` |
| AUTH-04 | P1 | Timeline uses Student.View; no dedicated timeline permission is proven | `OWNER DECISION` |
| AUTH-05 | P1 | Dismiss/suspend, archive/restore, and promote lack separate approval/operation permissions | `SECURITY DECISION` |
| AUTH-06 | P1 | Transfer is protected only by broad Student.Write; target-school/branch semantics are incomplete and the operation is already P0-blocked | `SECURITY + OPERATIONS GATE` |
| AUTH-07 | P1 | Bulk endpoint shares Student.Write and accepts an operation discriminator; per-operation authorization is not proven | `CODE FIX / SECURITY DECISION` |
| AUTH-08 | P1 | Authentication checks client school identifiers for mismatch, but operation-level target authorization must still be proven for each resource | `NOT PROVEN` |
| AUTH-09 | P2 | Permission registry contains legacy aliases and broad role definitions; presence of a permission does not prove route enforcement | `MAINTAINABILITY / SECURITY REVIEW` |
| AUTH-10 | P2 | UI permission visibility and backend authorization are not proven to be generated from one operation-level contract | `OWNER DECISION` |

## False authorization and false success review

- No authorization change was made.
- Disabled guardian actions from P0-006-02 are now native-disabled in the active Student Affairs portal.
- The graduation route can still return a success-shaped response from a legacy service; this remains blocked by P0-006-03 through P0-006-06 and must not be treated as a safe authorization success.
- Existing notifications and legacy services require separate operation-level review before they can be treated as authoritative.

## Final decision

`STOP — SECURITY/AUTHORIZATION DECISION REQUIRED`
