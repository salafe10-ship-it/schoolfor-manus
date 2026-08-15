# STU-AFFAIRS-P0-006-07 — Authorization Decision Package

Status: `STOP — SECURITY/OWNER DECISION REQUIRED`

## Purpose

This package defines the authorization contract to review before changing the Permission Registry, Authorization Engine, middleware, APIs, or UI. It is not an implementation authorization.

## Core decision

`Student.Write` is too broad to be the sole authorization for sensitive lifecycle operations. The contract must separate ordinary student data writes from lifecycle commands and approvals.

## Proposed capability boundary

| Capability family | Review position |
|---|---|
| Student identity read/export | Keep dedicated existing capabilities, subject to scope proof |
| Student ordinary create/update | Separate from lifecycle and approval actions |
| Guardian link/update | Separate link and update decisions; existing Guardian.Link must not be assumed to cover both |
| Timeline read | Decide whether Student.View is sufficient or a dedicated read capability is required |
| Lifecycle execution | Separate promote, re-enroll, suspend, dismiss, archive, restore, graduate, and transfer actions |
| Lifecycle approval | Separate maker/checker approval where policy requires it |
| Bulk operations | Separate operation-specific capability plus per-item authorization |
| Graduation | Disabled/withheld/domain-gated until the academic source-of-truth contract is approved |
| Transfer | Remains blocked behind the existing P0 security/operations gate |

## Non-negotiable rules

- Authentication answers who the actor is; authorization decides what the trusted actor may do.
- Tenant, school, branch, student, guardian, and document scope come from trusted context and server-side object checks.
- A permission registry entry does not prove route enforcement.
- Permission checks must occur before business logic and before any success response.
- Sensitive lifecycle actions must require reason, audit, and the approved concurrency/idempotency contract.
- Graduation cannot be enabled while its domain and academic source are not canonical.
- No client field can choose actor, tenant, school, branch, role, or approval authority.

## Implementation gate

No permission is added, removed, renamed, or reassigned by this package. Security and owner approval are required before code changes.
