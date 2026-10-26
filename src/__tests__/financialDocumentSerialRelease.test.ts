import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  applyFinancialSerialMigrations,
  financialMigrationBody,
  financialSerialMigrationFiles,
  secureDatabaseOptions,
  verifyFinancialSerialSchema,
} from '../../scripts/financialDocumentSerialRelease.mjs';

const migrations = financialSerialMigrationFiles.map((name) => ({
  name, sql: readFileSync(`supabase/migrations/${name}`, 'utf8'),
}));
const schemaReady = {
  invoice_column: true, journal_column: true, voucher_column: true,
  sequence_rls: true, sequence_policy: true, payment_sequence_kind: true,
  invoice_unique_index: true, journal_unique_index: true,
  receipt_unique_index: true, voucher_unique_index: true, receipt_sequence_table: true,
};

function clientFixture(overrides: {
  missingTables?: string[]; ownsTables?: boolean; schema?: Record<string, boolean>;
  missingNumbers?: number; failSecond?: boolean;
} = {}) {
  const query = vi.fn(async (sql: string) => {
    if (sql.includes('array_agg(required.name')) return { rows: [{ missing_tables: overrides.missingTables || null }] };
    if (sql.includes('current_user AS role_name')) return { rows: [{ role_name: 'migration_admin', database_name: 'isolated', owns_financial_tables: overrides.ownsTables ?? true }] };
    if (sql.includes('AS invoice_column')) return { rows: [overrides.schema || schemaReady] };
    if (sql.includes('AS invoices_missing_number')) return { rows: [{ invoices_missing_number: overrides.missingNumbers || 0, journals_missing_number: 0 }] };
    if (overrides.failSecond && sql.includes('ADD COLUMN IF NOT EXISTS source_document_number')) throw new Error('SECOND_MIGRATION_FAILED');
    return { rows: [] };
  });
  return { query };
}

describe('financial document serial release', () => {
  it('verifies TLS even when URL flags request an insecure connection', () => {
    const result = secureDatabaseOptions('postgres://admin:fixture@staging.invalid/db?sslmode=no-verify&sslcert=bad&uselibpqcompat=true&application_name=fees');
    expect(result.ssl.rejectUnauthorized).toBe(true);
    const url = new URL(result.connectionString);
    expect([...url.searchParams.keys()]).toEqual(['application_name']);
    expect(url.searchParams.get('application_name')).toBe('fees');
  });

  it('removes only the outer transaction wrappers from both real migration files', () => {
    for (const migration of migrations) {
      const body = financialMigrationBody(migration.sql);
      expect(body).not.toMatch(/^\s*(BEGIN|COMMIT);\s*$/m);
      expect(body).toContain('CREATE OR REPLACE FUNCTION public.prevent_erp_posted_journal_mutation()');
      expect(body).toMatch(/BEGIN\r?\n/);
    }
    expect(() => financialMigrationBody('BEGIN;\nSELECT 1;\nCOMMIT;\nBEGIN;\nCOMMIT;')).toThrow('TRANSACTION_WRAPPER_INVALID');
  });

  it('applies both migrations in order and commits only after voucher verification', async () => {
    const client = clientFixture();
    const result = await applyFinancialSerialMigrations(client, migrations);
    const sql = client.query.mock.calls.map((call) => call[0]);
    expect(result.migrations).toEqual(financialSerialMigrationFiles);
    expect(sql[0]).toBe('BEGIN');
    expect(sql.at(-1)).toBe('COMMIT');
    expect(sql.indexOf(financialMigrationBody(migrations[0].sql))).toBeLessThan(sql.indexOf(financialMigrationBody(migrations[1].sql)));
    expect(sql.findIndex((text) => text.includes('AS invoice_column'))).toBeGreaterThan(sql.indexOf(financialMigrationBody(migrations[1].sql)));
    expect(sql).not.toContain('ROLLBACK');
  });

  it('rolls back the entire release if its second migration fails', async () => {
    const client = clientFixture({ failSecond: true });
    await expect(applyFinancialSerialMigrations(client, migrations)).rejects.toThrow('SECOND_MIGRATION_FAILED');
    expect(client.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
  });

  it('refuses a missing baseline before applying financial DDL', async () => {
    const client = clientFixture({ missingTables: ['student_fee_invoices'] });
    await expect(applyFinancialSerialMigrations(client, migrations)).rejects.toThrow('FINANCIAL_SERIAL_BASELINE_REQUIRED: student_fee_invoices');
    expect(client.query.mock.calls.some(([sql]) => sql.includes('ALTER TABLE'))).toBe(false);
    expect(client.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });

  it('refuses a database role that cannot alter the complete financial target', async () => {
    const client = clientFixture({ ownsTables: false });
    await expect(applyFinancialSerialMigrations(client, migrations)).rejects.toThrow('ROLE_CANNOT_ALTER_TARGET_TABLES');
    expect(client.query.mock.calls.some(([sql]) => sql.includes('ALTER TABLE'))).toBe(false);
  });

  it('rolls back when the voucher contract or serial backfill is incomplete', async () => {
    for (const overrides of [{ schema: { ...schemaReady, voucher_unique_index: false } }, { missingNumbers: 1 }]) {
      const client = clientFixture(overrides);
      await expect(applyFinancialSerialMigrations(client, migrations)).rejects.toThrow(/FINANCIAL_SERIAL_(SCHEMA_NOT_READY|BACKFILL_INCOMPLETE)/);
      expect(client.query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
      expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    }
  });

  it('rejects a reordered or partial release before opening a transaction', async () => {
    const client = clientFixture();
    await expect(applyFinancialSerialMigrations(client, [...migrations].reverse())).rejects.toThrow('ORDER_INVALID');
    await expect(applyFinancialSerialMigrations(client, migrations.slice(0, 1))).rejects.toThrow('ORDER_INVALID');
    expect(client.query).not.toHaveBeenCalled();
  });

  it('keeps the schema gate read only and checks receipt and payment constraints', async () => {
    const client = clientFixture();
    await verifyFinancialSerialSchema(client);
    expect(client.query.mock.calls.every(([sql]) => sql.trim().startsWith('SELECT'))).toBe(true);
    const schemaSql = client.query.mock.calls[0][0];
    expect(schemaSql).toContain('uq_student_fee_receipt_official_number');
    expect(schemaSql).toContain('uq_erp_journal_source_document_number');
    expect(schemaSql).toContain("LIKE '%payment%'");
  });

  it('passes the database connection explicitly to the production schema gate', () => {
    const workflow = readFileSync('.github/workflows/cloudflare-production.yml', 'utf8');
    expect(workflow).toContain('PRODUCTION_URL: https://modern-family-schools.abdalsalamsoft.com');
    const gate = workflow.slice(workflow.indexOf('- name: Verify production application schema contract'), workflow.indexOf('- name: Deploy exact commit'));
    expect(gate).toContain('PLATFORM_ADMIN_DATABASE_URL: ${{ secrets.PLATFORM_ADMIN_DATABASE_URL }}');
    const uptime = readFileSync('.github/workflows/cloudflare-uptime.yml', 'utf8');
    expect(uptime).toContain('PRODUCTION_URL: https://modern-family-schools.abdalsalamsoft.com');
    const runner = readFileSync('scripts/apply-production-financial-document-serial-migration.mjs', 'utf8');
    expect(runner).toContain('applyFinancialSerialMigrations(client, migrations)');
    expect(runner).toContain("process.env.GITHUB_REF !== 'refs/heads/master'");
    const verify = readFileSync('scripts/verify-production-schema.ts', 'utf8');
    expect(verify).toContain('verifyFinancialSerialSchema(client)');
    expect(verify).not.toContain('rejectUnauthorized: false');
    const identityGate = readFileSync('scripts/verify-identity-access-governance.ts', 'utf8');
    expect(identityGate).toContain('secureDatabaseOptions(connectionString)');
    expect(identityGate).not.toContain('rejectUnauthorized: false');
  });
});
