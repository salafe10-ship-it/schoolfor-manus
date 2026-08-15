# ADR 008: Student Lifecycle

## Context
Students transition through various states (Applicant, Enrolled, Graduated, Archived) with specific rules for each.

## Decision
We will implement a State Machine via `StudentLifecycleManager` to explicitly define allowed transitions and validation rules for each lifecycle stage.

## Alternatives
- Ad-hoc status updates (Rejected: leads to inconsistent student states).

## Consequences
- Centralized rules for lifecycle management.
- Simplifies workflows for admission, enrollment, and graduation modules.

## Future Impact
Provides a clear, auditable trail of student progress throughout their academic journey.
