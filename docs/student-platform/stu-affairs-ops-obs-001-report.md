# STU-AFFAIRS-OPS-OBS-001 — PLATFORM OBSERVABILITY

## Mission status

`OBSERVABILITY BLOCKED`

## Scope

Staging evidence only. No application code, database, SQL, RLS, migration, authorization, tenant, export, or production change was performed.

## Evidence reviewed

- Render Staging deployment: `dep-d9u4fq8ae00c73bk7v30`.
- Deployed SHA: `c3c9a4cd616a6d092d382bfd53a79e6dea3e59de`.
- Render Logs surface available to Operations: `Application logs`.
- Application startup and PostgreSQL connection records are visible.
- The previous controlled Student Read produced a transaction rollback record, but no HTTP/access record and no `StudentReadRCA` stage record were observable.
- Repository inspection found no `render.yaml` logging configuration and no repository-defined HTTP/access-log sink.
- `EnterpriseLogger` emits structured JSON to stdout in production; this confirms an application log path, not request-level access observability.

## Required trace contract

Operations/Platform must provide a searchable, access-controlled Staging channel containing only:

- timestamp;
- HTTP method and route;
- HTTP status;
- request ID and correlation ID when available;
- service instance when available;
- deployment SHA;
- bounded application stage;
- bounded error classification.

The channel must exclude passwords, tokens, secrets, student data, SQL text, and sensitive SQL parameters.

## Current availability

| Capability | Status |
|---|---|
| Application stdout logs | AVAILABLE |
| HTTP/access logs | NOT OBSERVABLE |
| Request/correlation search | NOT OBSERVABLE |
| Request-level service instance | NOT OBSERVABLE |
| Safe Student Read stage trace | NOT OBSERVABLE |
| Deployment SHA verification | AVAILABLE |
| Database/RLS evidence | OUT OF SCOPE |

## Decision

`STU-AFFAIRS-OPS-OBS-001 = OBSERVABILITY BLOCKED`

The Student Read RCA must remain closed/blocked until Operations or Render provides the required access/request evidence. Do not repeat Student Read, add logging, change source, inspect SQL/RLS, or attempt Export under this mission.

## Next authorized dependency

Operations must either:

1. enable or expose the approved Staging HTTP/access log channel and document retention/access controls; or
2. provide an explicit platform statement that the channel is unavailable, with the approved alternative evidence source.

Only after `OBSERVABILITY READY` may a separate Student Read RCA mission be opened.
