import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { applyFinancialSerialMigrations, financialSerialMigrationFiles, secureDatabaseOptions } from './financialDocumentSerialRelease.mjs';

const confirmation = 'APPLY_FINANCIAL_DOCUMENT_NUMBERING_202610231100';
if (process.env.GITHUB_ACTIONS !== 'true'
  || process.env.GITHUB_REF !== 'refs/heads/master'
  || process.env.EDUPRO_ENVIRONMENT !== 'production'
  || process.env.PRODUCTION_FINANCIAL_MIGRATION_CONFIRM !== confirmation) {
  throw new Error('PRODUCTION_FINANCIAL_MIGRATION_GUARD_REJECTED');
}

const connectionString = String(process.env.PLATFORM_ADMIN_DATABASE_URL || '').trim();
if (!connectionString) throw new Error('PLATFORM_ADMIN_DATABASE_URL_REQUIRED');
const parsedUrl = new URL(connectionString);
if (/^edupro_(?:app|staging_app)(?:\.|$)/i.test(decodeURIComponent(parsedUrl.username))) {
  throw new Error('FINANCIAL_MIGRATION_REQUIRES_PLATFORM_ADMIN_ROLE');
}
const pool = new Pool({
  ...secureDatabaseOptions(connectionString),
  max: 1,
  connectionTimeoutMillis: 12_000,
});

try {
  const client = await pool.connect();
  try {
    const root = path.dirname(fileURLToPath(import.meta.url));
    const migrations = financialSerialMigrationFiles.map((name) => ({
      name, sql: fs.readFileSync(path.resolve(root, '../supabase/migrations', name), 'utf8'),
    }));
    const result = await applyFinancialSerialMigrations(client, migrations);
    console.log(JSON.stringify({
      success: true,
      migrations: result.migrations,
      database: result.identity.database_name,
      role: result.identity.role_name,
      verification: result.verification,
    }));
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
