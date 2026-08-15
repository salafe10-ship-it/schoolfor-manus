# STU-AFFAIRS-P0-002J — Implementation Report

## Mission

Canonical Batch Enrollment Transfer.

## Mission status

`STOP + RCA — DEPENDENCIES BLOCK IMPLEMENTATION`

## Root cause

The repository contains only a legacy student transfer path. It does not contain the canonical application service, transaction-aware Enrollment Transfer repositories, durable batch idempotency store, or the approved canonical command payload required by the CTO contract.

## Evidence

- `StudentAffairsPortal.handleBatchTransfer` sends one legacy student request at a time with class/section/stage values.
- `/api/students/:id/transfer`, `StudentEnrollmentService.transferStudent`, and `StudentRepository.update` mutate the legacy student path.
- `/api/students/bulk` is not a safe foundation because the outer bulk Unit of Work reaches a nested transfer Unit of Work.
- `UnitOfWork.runInTransaction` is usable and was not modified, but wrapping the legacy direct writes does not make them atomic.
- `outbox_events` is not an approved Batch Transfer result store; `IdempotencyGuard` is process-local.
- The canonical command requires source Enrollment ID, one source/destination context, transfer reason, academic context, expected version, and durable operation key; the current payload lacks these values.
- `stageId` has no approved canonical mapping.

## Changes made

No source, API, repository, UnitOfWork, schema, migration, RLS, authorization, or production files were modified for this mission. Only this report and its validation report were added.

## Why no workaround was used

Implementing a UI loop, patching the legacy endpoint, using process-local locks, reusing outbox without a contract, or inventing a mapping would violate the approved atomicity, idempotency, canonical-source, and scope rules.

## Required separate dependencies

1. Dedicated durable Transfer Batch Store schema/migration mission.
2. Canonical Enrollment Transfer application/repository implementation.
3. Final API command and trusted-context integration.
4. Approved canonical mapping for all required fields, including the exclusion of `stageId`.

## Decision

`P0-002J` is not remediated. It is safely blocked with a complete RCA. No later Student Affairs mission was started.
