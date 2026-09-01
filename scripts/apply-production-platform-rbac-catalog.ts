import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const EXPECTED_PRODUCTION_PROJECT_REF = 'bwdjnjbexklsrwqbwzmk';
const REQUIRED_CONFIRMATION = 'APPLY_PLATFORM_RBAC_CATALOG';
const MIGRATION = '202609011000_platform_rbac_catalog_seed.sql';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function removeTopLevelTransactionControls(sql: string): string {
  return sql.replace(
    /^\s*(?:BEGIN(?:\s+(?:WORK|TRANSACTION))?|COMMIT(?:\s+(?:WORK|TRANSACTION))?|ROLLBACK(?:\s+(?:WORK|TRANSACTION))?)\s*;\s*$/gim,
    '',
  );
}

async function main() {
  const connectionString = required(process.env.PRODUCTION_PLATFORM_ADMIN_DATABASE_URL, 'PRODUCTION_DATABASE_URL_REQUIRED');
  const confirmation = required(process.env.PRODUCTION_PLATFORM_CATALOG_CONFIRMATION, 'PRODUCTION_PLATFORM_CATALOG_CONFIRMATION_REQUIRED');
  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error('PRODUCTION_PLATFORM_CATALOG_CONFIRMATION_INVALID');
  if (!connectionString.includes(EXPECTED_PRODUCTION_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 12_000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    try {
      const sql = removeTopLevelTransactionControls(
        await readFile(resolve(process.cwd(), 'supabase', 'migrations', MIGRATION), 'utf8'),
      );
      await client.query('BEGIN');
      try {
        await client.query(sql);
        const verification = await client.query<{ valid: boolean }>(`
          SELECT EXISTS (
            SELECT 1
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
          ) AS valid
        `);
        if (!verification.rows[0]?.valid) throw new Error('PLATFORM_RBAC_CATALOG_VERIFICATION_FAILED');
        await client.query('COMMIT');
        console.log(JSON.stringify({
          success: true,
          projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
          catalog: 'platformadmin -> Platform.Admin',
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
