// Shared by the guarded release migration and the read-only schema gate.
export const financialSerialMigrationFiles = [
  '202610231100_financial_document_serial_numbers.sql',
  '202610241100_financial_voucher_serial_numbers.sql',
];

export function secureDatabaseOptions(connectionString) {
  const url = new URL(connectionString);
  // node-postgres can otherwise replace Pool.ssl from connection URL flags.
  for (const key of [...url.searchParams.keys()]) {
    if (/^ssl/i.test(key) || key.toLowerCase() === 'uselibpqcompat') url.searchParams.delete(key);
  }
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: true } };
}

export function financialMigrationBody(sql) {
  const begin = sql.match(/^[\t ]*BEGIN;[\t ]*\r?$/gm) || [];
  const commit = sql.match(/^[\t ]*COMMIT;[\t ]*\r?$/gm) || [];
  if (begin.length !== 1 || commit.length !== 1 || !/COMMIT;\s*$/.test(sql)
    || /^[\t ]*ROLLBACK;/m.test(sql)) {
    throw new Error('FINANCIAL_SERIAL_MIGRATION_TRANSACTION_WRAPPER_INVALID');
  }
  // Both files run under one outer transaction, including final verification.
  return sql.replace(/^[\t ]*BEGIN;[\t ]*\r?$/m, '').replace(/COMMIT;\s*$/, '');
}

export async function verifyFinancialSerialSchema(client) {
  const { rows } = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
        AND table_name='student_fee_invoices' AND column_name='invoice_number' AND data_type='text') AS invoice_column,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
        AND table_name='erp_journal_entries' AND column_name='journal_number' AND data_type='text') AS journal_column,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
        AND table_name='erp_journal_entries' AND column_name='source_document_number' AND data_type='text') AS voucher_column,
      COALESCE((SELECT relrowsecurity FROM pg_class
        WHERE oid=to_regclass('public.erp_financial_document_sequences')), false) AS sequence_rls,
      EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
        AND tablename='erp_financial_document_sequences'
        AND policyname='erp_financial_document_sequences_school_scope') AS sequence_policy,
      EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('public.erp_financial_document_sequences')
        AND conname='ck_erp_financial_document_sequence_kind'
        AND pg_get_constraintdef(oid) LIKE '%payment%') AS payment_sequence_kind,
      to_regclass('public.uq_student_fee_invoice_official_number') IS NOT NULL AS invoice_unique_index,
      to_regclass('public.uq_erp_journal_official_number') IS NOT NULL AS journal_unique_index,
      to_regclass('public.uq_student_fee_receipt_official_number') IS NOT NULL AS receipt_unique_index,
      to_regclass('public.uq_erp_journal_source_document_number') IS NOT NULL AS voucher_unique_index,
      to_regclass('public.student_fee_receipt_sequences') IS NOT NULL AS receipt_sequence_table
  `);
  const state = rows[0];
  if (!state || Object.values(state).some((value) => value !== true)) {
    throw new Error(`FINANCIAL_SERIAL_SCHEMA_NOT_READY: ${JSON.stringify(state || {})}`);
  }
  const counts = await client.query(`
    SELECT (SELECT count(*) FROM public.student_fee_invoices WHERE invoice_number IS NULL)::int AS invoices_missing_number,
           (SELECT count(*) FROM public.erp_journal_entries WHERE journal_number IS NULL)::int AS journals_missing_number
  `);
  const missing = counts.rows[0];
  if (!missing || Number(missing.invoices_missing_number) !== 0 || Number(missing.journals_missing_number) !== 0) {
    throw new Error(`FINANCIAL_SERIAL_BACKFILL_INCOMPLETE: ${JSON.stringify(missing || {})}`);
  }
  return { ...state, ...missing };
}

export async function applyFinancialSerialMigrations(client, migrations) {
  if (migrations.length !== financialSerialMigrationFiles.length
    || migrations.some((migration, index) => migration.name !== financialSerialMigrationFiles[index])) {
    throw new Error('FINANCIAL_SERIAL_MIGRATION_ORDER_INVALID');
  }
  const bodies = migrations.map((migration) => financialMigrationBody(migration.sql));
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '5min'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('edupro-financial-serial-release'))");
    const preflight = await client.query(`
      SELECT array_agg(required.name ORDER BY required.name)
        FILTER (WHERE to_regclass('public.' || required.name) IS NULL) AS missing_tables
      FROM unnest(ARRAY['schools', 'users', 'student_fee_invoices', 'student_fee_receipts',
        'erp_journal_entries', 'student_fee_receipt_sequences']) AS required(name)
    `);
    if (preflight.rows[0]?.missing_tables?.length) {
      throw new Error(`FINANCIAL_SERIAL_BASELINE_REQUIRED: ${preflight.rows[0].missing_tables.join(', ')}`);
    }
    const role = await client.query(`
      SELECT current_user AS role_name, current_database() AS database_name,
        COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname=current_user), false) AS is_superuser,
        COALESCE((SELECT bool_and(pg_has_role(current_user, c.relowner, 'USAGE'))
          FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relname IN
            ('student_fee_invoices', 'student_fee_receipts', 'erp_journal_entries', 'student_fee_receipt_sequences')),
          false) AS owns_financial_tables
    `);
    const identity = role.rows[0];
    if (!identity || (!identity.is_superuser && !identity.owns_financial_tables)) {
      throw new Error('FINANCIAL_MIGRATION_DATABASE_ROLE_CANNOT_ALTER_TARGET_TABLES');
    }
    for (const body of bodies) await client.query(body);
    const verification = await verifyFinancialSerialSchema(client);
    await client.query('COMMIT');
    return { identity, verification, migrations: migrations.map((migration) => migration.name) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
