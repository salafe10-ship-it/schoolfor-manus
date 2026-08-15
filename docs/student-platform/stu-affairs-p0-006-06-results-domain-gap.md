# STU-AFFAIRS-P0-006-06 — Academic Results Domain Gap

Status: `STOP — ACADEMIC DOMAIN DECISION REQUIRED`

## Confirmed gap

The current Exams/Results module is a UI-oriented JSON document and calculation surface, not a canonical academic-results domain. It contains seeded subjects, students, and marks, computes percentages in React, and persists a broad JSON payload through `exams_database`. It does not prove result ownership, academic-context linkage, locked final results, reproducible GPA, or graduation eligibility.

## Required canonical chain

`Student → Enrollment → Academic Year + Term → Subject/Course → Assessment/Exam → Raw Mark → Validated Result → Final Result Snapshot → GPA / Percentage → Graduation Eligibility`

Each link must be tenant/school/branch scoped, versioned, auditable, and owned by an approved domain. The chain is a design target only and is not approved schema.

## Current-to-required gap map

| Capability | Current state | Required future state |
|---|---|---|
| Exam definition | Component configuration and JSON | Versioned academic definition owned by Results/Examinations |
| Exam attempt | Not proven as a canonical entity | Student/enrollment/context-specific attempt |
| Raw mark | JSON grade matrix | Durable, validated, actor-attributed mark |
| Calculated result | React calculation | Server-authoritative, versioned calculation |
| Final result | Not proven | Approved, locked result snapshot |
| GPA | No canonical source | Policy-versioned output from locked results |
| Result history | Local snapshots/audit-like state | Immutable domain history and correction lineage |
| Graduation eligibility | Fee/status check in legacy service | Academic policy evaluation over approved results |

## Decision

Do not migrate, delete, or promote the current JSON/React results path until the owner matrix below is approved.
