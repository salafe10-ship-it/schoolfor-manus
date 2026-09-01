import { Pool } from 'pg';

const EXPECTED_PRODUCTION_PROJECT_REF = 'bwdjnjbexklsrwqbwzmk';
const REQUIRED_CONFIRMATION = 'PROVISION_FIRST_PLATFORM_ADMIN';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

async function main() {
  const connectionString = required(process.env.PRODUCTION_PLATFORM_ADMIN_DATABASE_URL, 'PRODUCTION_DATABASE_URL_REQUIRED');
  const confirmation = required(process.env.FIRST_PLATFORM_ADMIN_CONFIRMATION, 'FIRST_PLATFORM_ADMIN_CONFIRMATION_REQUIRED');
  const targetAuthUserId = required(process.env.TARGET_AUTH_USER_ID, 'TARGET_AUTH_USER_ID_REQUIRED');

  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error('FIRST_PLATFORM_ADMIN_CONFIRMATION_INVALID');
  if (!connectionString.includes(EXPECTED_PRODUCTION_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetAuthUserId)) {
    throw new Error('TARGET_AUTH_USER_ID_INVALID');
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 12_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        const authUser = await client.query<{ id: string }>(
          'SELECT id FROM auth.users WHERE id = $1::uuid FOR UPDATE',
          [targetAuthUserId],
        );
        if (!authUser.rows[0]) throw new Error('TARGET_AUTH_USER_NOT_FOUND');

        const role = await client.query<{ id: string }>(`
          SELECT role.id
            FROM public.platform_roles role
            JOIN public.platform_role_permissions link
              ON link.role_id = role.id AND link.status = 'active' AND link.deleted_at IS NULL
            JOIN public.platform_permissions permission
              ON permission.id = link.permission_id
           WHERE role.role_key = 'platformadmin'
             AND role.status = 'active'
             AND role.deleted_at IS NULL
             AND permission.permission_key = 'Platform.Admin'
             AND permission.status = 'active'
             AND permission.deleted_at IS NULL
           FOR UPDATE OF role
        `);
        const roleId = role.rows[0]?.id;
        if (!roleId) throw new Error('PLATFORM_RBAC_CATALOG_NOT_READY');

        const created = await client.query<{ id: string }>(`
          INSERT INTO public.platform_users (auth_user_id, status)
          VALUES ($1::uuid, 'active')
          ON CONFLICT (auth_user_id) DO UPDATE
            SET status = 'active', deleted_at = NULL, updated_at = now()
          RETURNING id
        `, [targetAuthUserId]);
        const platformUserId = created.rows[0]?.id;
        if (!platformUserId) throw new Error('PLATFORM_USER_PROVISION_FAILED');

        await client.query(`
          INSERT INTO public.platform_user_roles (platform_user_id, role_id, status, starts_at, ends_at, deleted_at)
          VALUES ($1::uuid, $2::uuid, 'active', now(), NULL, NULL)
          ON CONFLICT (platform_user_id, role_id)
            WHERE status = 'active' AND deleted_at IS NULL
          DO UPDATE SET status = 'active', starts_at = now(), ends_at = NULL, deleted_at = NULL, updated_at = now()
        `, [platformUserId, roleId]);

        const verification = await client.query<{ valid: boolean }>(`
          SELECT EXISTS (
            SELECT 1
              FROM public.platform_users platform_user
              JOIN public.platform_user_roles assignment
                ON assignment.platform_user_id = platform_user.id
               AND assignment.status = 'active'
               AND assignment.deleted_at IS NULL
              JOIN public.platform_roles role ON role.id = assignment.role_id
             WHERE platform_user.auth_user_id = $1::uuid
               AND platform_user.status = 'active'
               AND platform_user.deleted_at IS NULL
               AND role.role_key = 'platformadmin'
          ) AS valid
        `, [targetAuthUserId]);
        if (!verification.rows[0]?.valid) throw new Error('FIRST_PLATFORM_ADMIN_VERIFICATION_FAILED');

        await client.query('COMMIT');
        console.log(JSON.stringify({
          success: true,
          projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
          firstPlatformAdmin: 'provisioned',
        }));
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
