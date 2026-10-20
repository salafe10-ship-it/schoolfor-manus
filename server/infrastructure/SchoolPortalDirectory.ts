import type { Pool } from 'pg';

export type PublicSchoolPortal = { id: string; name: string };

/** Resolve a public address to exactly one active school, without user data. */
export async function resolveSchoolPortal(
  pool: Pick<Pool, 'query'>,
  context: string,
): Promise<PublicSchoolPortal | null> {
  const normalizedContext = context.trim().toLowerCase();
  if (!normalizedContext || normalizedContext.length > 100) return null;
  const result = await pool.query<{ id: string; name: string }>(
    `SELECT s.id, COALESCE(NULLIF(s.display_name, ''), s.legal_name) AS name
       FROM public.schools s
       JOIN public.tenants t ON t.id = s.tenant_id
      WHERE s.deleted_at IS NULL AND s.status = 'active'
        AND t.deleted_at IS NULL AND t.status = 'active'
        AND (s.id::text = $1
          OR lower(COALESCE(s.central_metadata->>'subdomain', '')) = $1
          OR lower(s.school_code) = $1
          OR (lower(t.slug) = $1 AND NOT EXISTS (
            SELECT 1 FROM public.schools other
             WHERE other.tenant_id = s.tenant_id AND other.id <> s.id
               AND other.deleted_at IS NULL AND other.status = 'active'
          )))
      LIMIT 2`,
    [normalizedContext],
  );
  // A tenant slug may represent a single-school tenant. Never pick an
  // arbitrary school when a public alias matches more than one record.
  if (result.rows.length !== 1) return null;
  return { id: result.rows[0].id, name: result.rows[0].name };
}
