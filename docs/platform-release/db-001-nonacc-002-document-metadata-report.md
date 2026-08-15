# DB-001-NONACC-002 — Document Metadata Canonical Persistence Reality

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-002`  
**Mode:** Bounded static/read-only audit  
**External mutation:** None  
**Decision:** `BLOCKED — CANONICAL DOCUMENT METADATA CONTRACT/SCHEMA DEPENDENCY`

## Finding

`DocumentRepository.saveMetadata` delegates to `FallbackStorage.performWrite`, but its canonical callback is an empty no-op and its fallback callback is also empty. Therefore the method does not perform a real metadata write and cannot truthfully establish canonical persistence.

The repository references `dms_documents`, but no canonical table contract, migration, API write contract, or existing repository writer for that table is present in the inspected project source. The active Student Documents module uses a separate canonical path and does not provide an approved drop-in contract for this legacy `DocumentRepository` method.

## Why execution is blocked

Making this method real would require at least one decision outside the bounded mission:

- an approved canonical table/schema contract for `dms_documents`, or
- an approved API/repository contract mapping this legacy service to the active Student Documents metadata path.

Implementing an ad-hoc upsert would invent schema assumptions and could create a second source of truth. Adding a migration, changing the API contract, changing Storage/Binary behavior, or modifying the active Student Documents architecture is explicitly forbidden.

## Safety outcome

- No false canonical success is claimed by a newly invented implementation.
- No fallback or `FallbackStorage` code was changed.
- No database, SQL, migration, RLS, Storage/Binary, authorization, tenant, production, or staging change was made.
- No automatic retry was added.

## Required owner decision

The next authorized mission must provide one of:

1. An approved existing canonical metadata contract/table for `dms_documents`, including fields and tenant ownership; or
2. Approval to retire/redirect this legacy service to the active Student Documents metadata contract.

## Classification

`P1 — RELEASE BLOCKING PERSISTENCE RISK`, because the method can give the caller a completed promise without a real canonical write. It is not classified as P0 because no live data corruption or production false-success incident was proven by this static audit.
