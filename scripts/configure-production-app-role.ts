import { Pool } from 'pg';

const EXPECTED_PRODUCTION_PROJECT_REF = 'bwdjnjbexklsrwqbwzmk';
const REQUIRED_CONFIRMATION = 'CONFIGURE_PRODUCTION_APP_ROLE';

function required(value: string | undefined, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

async function main() {
  const connectionString = required(process.env.PRODUCTION_PLATFORM_ADMIN_DATABASE_URL, 'PRODUCTION_DATABASE_URL_REQUIRED');
  const confirmation = required(process.env.PRODUCTION_APP_ROLE_CONFIRMATION, 'PRODUCTION_APP_ROLE_CONFIRMATION_REQUIRED');
  const appRolePassword = required(process.env.PRODUCTION_APP_ROLE_PASSWORD, 'PRODUCTION_APP_ROLE_PASSWORD_REQUIRED');

  if (confirmation !== REQUIRED_CONFIRMATION) throw new Error('PRODUCTION_APP_ROLE_CONFIRMATION_INVALID');
  if (!connectionString.includes(EXPECTED_PRODUCTION_PROJECT_REF)) throw new Error('TARGET_PROJECT_REF_MISMATCH');
  if (appRolePassword.length < 24) throw new Error('PRODUCTION_APP_ROLE_PASSWORD_TOO_SHORT');

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
        const passwordCommand = await client.query<{ statement: string }>(
          `SELECT format('ALTER ROLE edupro_app PASSWORD %L', $1::text) AS statement`,
          [appRolePassword],
        );
        const statement = passwordCommand.rows[0]?.statement;
        if (!statement) throw new Error('APP_ROLE_PASSWORD_STATEMENT_UNAVAILABLE');
        await client.query(statement);

        const verification = await client.query<{
          can_login: boolean;
          bypass_rls: boolean;
          superuser: boolean;
          can_create_role: boolean;
          can_create_database: boolean;
          connection_limit: number;
          schema_usage: boolean;
        }>(`
          SELECT
            role.rolcanlogin AS can_login,
            role.rolbypassrls AS bypass_rls,
            role.rolsuper AS superuser,
            role.rolcreaterole AS can_create_role,
            role.rolcreatedb AS can_create_database,
            role.rolconnlimit AS connection_limit,
            has_schema_privilege('edupro_app', 'public', 'USAGE') AS schema_usage
          FROM pg_roles role
         WHERE role.rolname = 'edupro_app'
        `);
        const posture = verification.rows[0];
        if (!posture || !posture.can_login || posture.bypass_rls || posture.superuser || posture.can_create_role
          || posture.can_create_database || posture.connection_limit !== 40 || !posture.schema_usage) {
          throw new Error('APP_ROLE_SECURITY_POSTURE_FAILED');
        }
        await client.query('COMMIT');
        console.log(JSON.stringify({
          success: true,
          projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
          role: 'edupro_app',
          login: true,
          bypassRls: false,
          superuser: false,
          connectionLimit: posture.connection_limit,
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
