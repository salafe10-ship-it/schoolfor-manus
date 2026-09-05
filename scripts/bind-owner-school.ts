import 'dotenv/config';
import { Pool } from 'pg';

const EXPECTED_PROJECT_REF = 'wjhraxvxvvthxqlpyohh';
const REQUIRED_CONFIRMATION = 'BIND_OWNER_SCHOOL';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function uuid(value: string, code: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error(code);
  return value;
}

async function main(): Promise<void> {
  if (required(process.env.OWNER_SCHOOL_BIND_CONFIRMATION, 'OWNER_SCHOOL_BIND_CONFIRMATION_REQUIRED') !== REQUIRED_CONFIRMATION) {
    throw new Error('OWNER_SCHOOL_BIND_CONFIRMATION_INVALID');
  }
  const schoolId = uuid(required(process.env.OWNER_SCHOOL_ID, 'OWNER_SCHOOL_ID_REQUIRED'), 'OWNER_SCHOOL_ID_INVALID');
  const ownerAuthUserId = uuid(required(process.env.OWNER_AUTH_USER_ID, 'OWNER_AUTH_USER_ID_REQUIRED'), 'OWNER_AUTH_USER_ID_INVALID');
  const connectionString = required(
    process.env.PLATFORM_ADMIN_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL,
    'DATABASE_CONNECTION_REQUIRED',
  );
  const supabaseUrl = required(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, 'SUPABASE_URL_REQUIRED');
  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF) || !connectionString.includes(EXPECTED_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 8_000),
    ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const identity = await client.query<{ school_id: string | null }>(`
      SELECT u.school_id
        FROM public.platform_users pu
        JOIN public.platform_user_roles pur ON pur.platform_user_id = pu.id
        JOIN public.platform_roles pr ON pr.id = pur.role_id
        JOIN public.users u ON u.auth_user_id = pu.auth_user_id
       WHERE pu.auth_user_id = $1::uuid
         AND pu.status = 'active' AND pu.deleted_at IS NULL
         AND pur.status = 'active' AND pur.deleted_at IS NULL
         AND pr.role_key = 'platformadmin' AND pr.status = 'active' AND pr.deleted_at IS NULL
         AND u.status = 'active' AND u.deleted_at IS NULL
       LIMIT 1
    `, [ownerAuthUserId]);
    if (identity.rowCount !== 1 || identity.rows[0].school_id !== schoolId) throw new Error('OWNER_PLATFORM_IDENTITY_SCHOOL_MISMATCH');

    const school = await client.query<{ id: string; display_name: string; central_metadata: unknown }>(
      `SELECT id, display_name, central_metadata FROM public.schools WHERE id = $1::uuid AND deleted_at IS NULL FOR UPDATE`,
      [schoolId],
    );
    if (school.rowCount !== 1) throw new Error('OWNER_SCHOOL_NOT_FOUND');
    const metadata = school.rows[0].central_metadata && typeof school.rows[0].central_metadata === 'object' && !Array.isArray(school.rows[0].central_metadata)
      ? school.rows[0].central_metadata as Record<string, unknown>
      : {};
    const previousWorkspace = metadata.ownerWorkspace && typeof metadata.ownerWorkspace === 'object' && !Array.isArray(metadata.ownerWorkspace)
      ? metadata.ownerWorkspace as Record<string, unknown>
      : {};
    const nextMetadata = {
      ...metadata,
      portal_profile: 'owner_controlled',
      ownerWorkspace: { ...previousWorkspace, mode: 'owner', kind: 'owner', releaseChannel: previousWorkspace.releaseChannel || 'stable' },
    };
    const updated = await client.query<{ id: string; display_name: string }>(
      `UPDATE public.schools SET central_metadata = $2::jsonb, updated_at = now(), version = version + 1 WHERE id = $1::uuid RETURNING id, display_name`,
      [schoolId, JSON.stringify(nextMetadata)],
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ success: true, schoolId: updated.rows[0].id, schoolName: updated.rows[0].display_name, ownerAuthUserId, mode: 'owner' }));
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original error */ }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
