import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rehearseEncryptedStagingBackupSchemaRestore } from './staging-backup-restore-rehearsal.js';

/**
 * Backwards-compatible entry point for the current encrypted, schema-only
 * restore rehearsal. The former implementation expected the obsolete
 * 56-table pre-reconciliation snapshot and wrote a second plaintext archive.
 */
export async function createStagingSchemaRehearsal() {
  const result = await rehearseEncryptedStagingBackupSchemaRestore();
  return {
    databaseName: result.databaseName,
    manifestPath: result.manifestPath,
    publicTables: result.tableCount,
    copiedRows: result.copiedRows,
    encryptedBackupFile: result.encryptedBackupFile,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createStagingSchemaRehearsal().then((result) => {
    console.info(`Encrypted schema-only restore rehearsal passed: ${result.publicTables} tables, ${result.copiedRows} rows copied.`);
    console.info(`Local rehearsal database: ${result.databaseName}`);
    console.info(`Manifest: ${result.manifestPath}`);
    console.info('The protected source backup is retained; no Staging rows were copied.');
  }).catch((error) => {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    console.error(/^(?:STAGING|LOCAL_SCHEMA_REHEARSAL)_[A-Z0-9_]+$/.test(message)
      ? message : /^[0-9A-Z]{5}$/.test(code)
        ? `STAGING_BACKUP_RESTORE_REHEARSAL_FAILED:${code}`
        : 'STAGING_BACKUP_RESTORE_REHEARSAL_FAILED');
    process.exitCode = 1;
  });
}
