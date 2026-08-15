# DB-HISTORY-ALIGN-001 — Schema Forensics

## Live Staging inventory

The official Supabase inspection channel previously returned:

- Public tables: **47**
- Non-public objects: **3** (`inf001a_*` records)
- Total objects reported: **50**
- Estimated public rows: **14**
- Total indexes: **270**
- Public indexes: **264**
- Non-public indexes: **6**
- Public unconsumed indexes: **176**

The 47 public table names match the union of tables declared by migrations 1–8. This is object-presence evidence only; it does not prove matching columns, defaults, foreign keys, checks, indexes, RLS definitions, or execution provenance.

## RLS evidence

The permitted Supabase UI showed `student_status_transitions` with RLS enabled and four policies. This is a valid partial signal for migration 9, but it is not evidence that all 46 policies in `202608081700_db_sec_003_rls.sql` match the live database.

## Constraint evidence

The permitted Table Editor showed `student_status_transitions` and its key columns. The permitted UI did not expose the full text of `ck_student_status_transitions_allowed`; therefore the presence of `active → withdrawn` cannot be proved live in this mission.

## Unsupported comparison paths

- `supabase db diff --linked` could not complete because the local Supabase CLI diff path requires Docker Desktop, which is unavailable.
- `supabase db dump --linked --schema public` could not complete for the same platform limitation. It was not retried because a dry-run emitted connection credentials and credential output is prohibited.

## Forensic conclusion

The live database is compatible at the object-name level with the first eight migrations, but the evidence is insufficient to classify any migration as schema-equivalent. The state is therefore **Unknown / unprovable**, not “already applied.”
