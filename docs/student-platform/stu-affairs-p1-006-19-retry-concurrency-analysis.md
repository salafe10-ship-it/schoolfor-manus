# STU-AFFAIRS-P1-006-19 — Retry and Concurrency Analysis

## Current Retry Behavior

- Guardian update requires expected Guardian and relationship versions.
- Student update requires the expected Student version.
- The UI does not reuse a single composite idempotency key across both requests.
- A Guardian success followed by Student failure leaves a committed Guardian change.
- Retrying with the original in-memory versions can be rejected as stale after Guardian has committed.
- A browser or network timeout cannot prove whether the first request committed; reload/reconciliation is required before retrying.

## Concurrency Matrix

| Race | Expected behavior | Current evidence |
|---|---|---|
| Two Guardian edits | One version wins; stale version is rejected | Canonical Guardian service checks both versions under lock |
| Two Student edits | One version wins; stale Student version is rejected | Canonical Student repository checks version under lock |
| Guardian then Student composite race | Guardian may commit before Student conflict | No shared transaction or composite change set |
| Student then Guardian concurrent edit | Independent aggregate outcomes | No shared composite command |

## Audit and Outbox

The current services write audit/outbox data per successful aggregate operation. They do not represent the two-request form as one atomic change set. A future composite design must define whether one domain event is emitted after the combined commit or whether separate events are acceptable.

## Required Reconciliation Contract

Before any composite implementation, the owner must decide the user-visible result for:

- Guardian committed / Student rejected.
- Student committed / Guardian rejected.
- Request timed out after unknown commit state.
- One version became stale during the form operation.
- Safe replay after a partial outcome.

## Security Note

The analysis found no need to weaken trusted authentication, authorization, tenant resolution, or version checks. Any future composite command must preserve those gates before opening the transaction.
