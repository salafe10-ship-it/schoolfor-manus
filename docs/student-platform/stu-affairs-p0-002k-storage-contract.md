# STU-AFFAIRS-P0-002K — Durable Transfer Batch Store Contract

## Mission boundary

Design only. No table, migration, SQL, RLS, database mutation, or application implementation is included.

## Purpose

Persist the identity and outcome of a canonical Batch Enrollment Transfer so retries, concurrent requests, and unknown commit outcomes cannot create duplicate transfer, history, audit, or outbox records.

## Logical record

The future record is a `TransferOperation` owned by the Student/Enrollment platform and scoped to one trusted tenant. It is a command/idempotency record, not an integration event and not a replacement for `enrollment_transfers`.

## Required attributes

- immutable operation ID;
- tenant ID and trusted operation namespace;
- client operation key;
- canonical payload hash;
- lifecycle status;
- request and correlation IDs;
- trusted actor reference;
- source and destination context fingerprint;
- result reference (batch and item transfer IDs, or a stable result document);
- failure/reconciliation reason;
- claim, completion, and last-update timestamps;
- retry/attempt metadata;
- optimistic version.

## Ownership rules

- The server creates and claims the record after authentication, authorization, and trusted tenant resolution.
- The client supplies only an opaque operation key and business input; it never supplies tenant, actor, role, or result state.
- The record is unique by `(tenant, operation namespace, operation key)`.
- The payload hash is compared before any replay.

## Separation of concerns

The store protects command replay. `enrollment_transfers` remains domain transfer history; `audit_events` remains compliance evidence; `outbox_events` remains integration delivery state. None of these records may be silently substituted for another.
