# STU-AFFAIRS-P1-UI-007 — Guardian Save False-Success Containment

## Root cause

The Student Affairs modal rendered a static success sentence in tabs that are visible before the save operation. The canonical request path itself already awaited the Guardian and Student responses before issuing the success notification, but the static sentence could mislead the user before any commit.

## Implemented containment

The static sentence was replaced with an explicit pre-save state:

> لم يتم حفظ هذه البيانات بعد. احفظ السجل أولاً لتأكيدها.

The existing save flow remains unchanged: Guardian success is confirmed from the awaited canonical response, then Student success is confirmed from its awaited canonical response. Non-2xx, exceptions, timeout/unknown outcomes, and partial results continue to produce warning messages rather than success.

## Scope confirmation

Only `StudentAffairsPortal.tsx` and its focused contract test were changed. No API, repository, service, UnitOfWork, database, SQL, migration, RLS, authorization, tenant, or UI redesign changes were made.

## Mission status

`STU-AFFAIRS-P1-UI-007 = IMPLEMENTED / VALIDATION PENDING`
