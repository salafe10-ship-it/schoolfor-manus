# EVIDENCE-GATE-001 — Platform Evidence Decision

## Scope

Decision analysis only. No code, deployment, environment change, database access, SQL, RLS, role operation, secret, token, or Production action was performed.

## Question 1 — Is there a safe current path?

**Decision: NO, not through the currently approved and observable surfaces.**

The project contains an existing Staging-only authenticated endpoint that returns only the four approved fields: `current_user`, `session_user`, `rolsuper`, and `rolbypassrls`. The source and local build include it, and Render reports the deployment Live. However:

- The live System Health route does not expose the existing invocation control.
- Direct browser navigation to the endpoint/static asset is blocked by `ERR_BLOCKED_BY_CLIENT`.
- The current browser surface cannot read the deployed artifact or invoke the endpoint with the app’s authenticated session without extracting a token.
- Supabase SQL Editor / `postgres` is not an acceptable proof of application identity.
- No approved direct `edupro_staging_app` execution channel is available in the current workflow.

Therefore the four connection-identity values remain **unproven**, not failed.

## Question 2 — Minimum approved structural capability

The least-risk requirement is a **platform-level, authenticated observability channel** that invokes the existing Staging endpoint or exposes the deployed artifact mapping without revealing secrets. It must:

1. Run only in Staging.
2. Use the already-authenticated application identity.
3. Return only the four approved identity fields.
4. Require no `postgres`, `service_role`, `SET ROLE`, SQL Editor, token extraction, or password handling.
5. Be readable through an approved Render/browser operator surface.

This is an operations/platform capability decision, not permission to add another application endpoint or diagnostic workaround. No implementation is authorized by this report.

## Question 3 — Can certification be deferred safely?

**Yes.** Deferring the connection-identity and downstream RLS certification does not reduce the existing security posture; it preserves the fail-closed decision. What is deferred is the evidence and certification claim, not the security controls themselves.

## Decision

`SECURITY CERTIFICATION BLOCKED BY EVIDENCE AVAILABILITY — NOT BY PROVEN SECURITY FAILURE`.

Do not start `DB-SEC-004`, `AUTH-004A`, or `DOC-002`. Do not add more diagnostic missions or change code until an approved platform evidence channel is provided.
