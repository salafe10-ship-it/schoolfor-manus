# ADR 006: Revenue Recognition

## Context
Academic revenue recognition requires complex deferred revenue management based on enrollment status and billing policies.

## Decision
We will utilize a dedicated `AcademicRevenueRecognitionEngine` that calculates recognition based on time and academic milestones, rather than simple invoicing events.

## Alternatives
- Direct revenue recognition on invoice (Rejected: fails to meet accrual accounting standards).

## Consequences
- Complex financial domain rules to maintain.
- Accurate financial reporting.

## Future Impact
Supports complex tuition billing and deferred revenue cycles.
