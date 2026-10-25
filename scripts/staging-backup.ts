import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID, X509Certificate } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { extractPostgresProjectRef } from '../server/security/SupabaseDatabaseTargetAlignment.js';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';
import { defaultStagingVaultDirectory } from './staging-secret-store.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stagingEnvPath = path.join(repositoryRoot, '.env.staging');
const dpapiScript = path.join(repositoryRoot, 'scripts', 'staging-dpapi.ps1');

function escapePgpass(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll('\n', '').replaceAll('\r', '');
}

export function resolveStagingBackupTarget(values: Record<string, string | undefined>) {
  validateStagingEnvironmentValues(values);
  const rawUrl = values.PLATFORM_ADMIN_DATABASE_URL;
  if (!rawUrl) throw new Error('STAGING_ADMIN_DATABASE_URL_REQUIRED');
  const url = new URL(rawUrl);
  const projectRef = extractPostgresProjectRef(rawUrl);
  const username = decodeURIComponent(url.username);
  const roleName = username.split('.')[0];
  const allowedHost = url.hostname.endsWith('.pooler.supabase.com')
    || url.hostname === `db.${projectRef}.supabase.co`;

  if (projectRef !== 'vjcjscqgmijgzagshsca' || roleName !== 'postgres'
    || !allowedHost || !['5432', '6543'].includes(url.port || '5432')
    || url.pathname !== '/postgres' || !url.password) {
    throw new Error('STAGING_BACKUP_TARGET_REJECTED');
  }

  const password = decodeURIComponent(url.password);
  if (!password) throw new Error('STAGING_BACKUP_CREDENTIAL_REQUIRED');
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: 'postgres',
    username,
    password,
  };
}

function runDpapi(action: 'seal' | 'open', source: string, destination: string): void {
  try {
    const sourceText = fs.readFileSync(dpapiScript, 'utf8');
    const command = `& { ${sourceText} } -Action $env:EDUPRO_DPAPI_ACTION -Source $env:EDUPRO_DPAPI_SOURCE -Destination $env:EDUPRO_DPAPI_DESTINATION`;
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true,
      stdio: 'ignore',
      timeout: 30_000,
      env: {
        ...process.env,
        EDUPRO_DPAPI_ACTION: action,
        EDUPRO_DPAPI_SOURCE: source,
        EDUPRO_DPAPI_DESTINATION: destination,
      },
    });
  } catch {
    throw new Error('STAGING_BACKUP_DPAPI_FAILED');
  }
}

function requireSuccessful(command: 'pg_dump.exe' | 'pg_restore.exe', args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, {
    env,
    stdio: 'ignore',
    timeout: 60 * 60 * 1000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) throw new Error(`STAGING_BACKUP_${command === 'pg_dump.exe' ? 'DUMP' : 'VERIFY'}_FAILED`);
}

function createArchiveListEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...env, PGAPPNAME: 'edupro-staging-backup-verify' };
}

export function createEncryptedStagingBackup(): string {
  if (process.platform !== 'win32') throw new Error('STAGING_BACKUP_REQUIRES_WINDOWS_DPAPI');
  if (!fs.existsSync(stagingEnvPath)) throw new Error('LOCAL_STAGING_ENV_FILE_MISSING');
  const envStat = fs.lstatSync(stagingEnvPath);
  if (!envStat.isFile() || envStat.isSymbolicLink()) throw new Error('LOCAL_STAGING_ENV_FILE_INVALID');
  const values = dotenv.parse(fs.readFileSync(stagingEnvPath));
  const target = resolveStagingBackupTarget(values);
  const vault = defaultStagingVaultDirectory();
  const vaultStat = fs.lstatSync(vault);
  if (!vaultStat.isDirectory() || vaultStat.isSymbolicLink()) throw new Error('STAGING_VAULT_DIRECTORY_INVALID');
  restrictFilePermissions(vault);
  const caPath = path.join(vault, 'prod-ca-2021.crt');
  if (!fs.existsSync(caPath)) throw new Error('STAGING_CA_CERTIFICATE_MISSING');
  try {
    if (!new X509Certificate(fs.readFileSync(caPath, 'utf8')).ca) throw new Error('not-a-ca');
  } catch {
    throw new Error('STAGING_CA_CERTIFICATE_INVALID');
  }

  const backupDirectory = path.join(vault, 'backups');
  fs.mkdirSync(backupDirectory, { recursive: true });
  if (fs.lstatSync(backupDirectory).isSymbolicLink()) throw new Error('STAGING_BACKUP_DIRECTORY_SYMLINK_REFUSED');
  restrictFilePermissions(backupDirectory);

  const nonce = randomUUID();
  const stamp = new Date().toISOString().replaceAll(/[-:]/g, '').replace('.', '');
  const plaintextPath = path.join(backupDirectory, `.staging-public-${nonce}.dump`);
  const passFilePath = path.join(backupDirectory, `.staging-pass-${nonce}`);
  const verifyPath = path.join(backupDirectory, `.staging-verify-${nonce}.dump`);
  const encryptedPath = path.join(backupDirectory, `staging-public-${stamp}-${nonce}.dump.dpapi`);

  const passLine = Buffer.from([
    escapePgpass(target.host),
    escapePgpass(target.port),
    escapePgpass(target.database),
    escapePgpass(target.username),
    escapePgpass(target.password),
  ].join(':') + '\n', 'utf8');

  const libpqEnvironment = {
    ...process.env,
    PGPASSFILE: passFilePath,
    PGSSLMODE: 'verify-full',
    PGSSLROOTCERT: caPath,
    PGCONNECT_TIMEOUT: '20',
    PGAPPNAME: 'edupro-staging-public-backup',
  };

  try {
    fs.writeFileSync(passFilePath, passLine, { flag: 'wx', mode: 0o600 });
    restrictFilePermissions(passFilePath);
    const plainFd = fs.openSync(plaintextPath, 'wx', 0o600);
    fs.closeSync(plainFd);
    restrictFilePermissions(plaintextPath);
    requireSuccessful('pg_dump.exe', [
      '--no-password', '--host', target.host, '--port', target.port,
      '--username', target.username, '--dbname', target.database,
      '--format=custom', '--schema=public', '--no-owner',
      '--lock-wait-timeout=30s', '--file', plaintextPath,
    ], libpqEnvironment);

    requireSuccessful('pg_restore.exe', ['--list', plaintextPath], createArchiveListEnvironment(libpqEnvironment));
    runDpapi('seal', plaintextPath, encryptedPath);
    restrictFilePermissions(encryptedPath);
    runDpapi('open', encryptedPath, verifyPath);
    restrictFilePermissions(verifyPath);
    requireSuccessful('pg_restore.exe', ['--list', verifyPath], createArchiveListEnvironment(libpqEnvironment));
    return encryptedPath;
  } catch (error) {
    fs.rmSync(encryptedPath, { force: true });
    throw error;
  } finally {
    passLine.fill(0);
    fs.rmSync(plaintextPath, { force: true });
    fs.rmSync(verifyPath, { force: true });
    fs.rmSync(passFilePath, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const archivePath = createEncryptedStagingBackup();
    console.info(`Encrypted Staging public-schema backup created and archive-verified: ${archivePath}`);
    console.info('The backup contains public schema definitions and rows; secrets were not printed.');
    console.info('Supabase scheduled physical backups remain the full-project restoration source.');
  } catch (error) {
    console.error(error instanceof Error && /^STAGING_[A-Z_]+$/.test(error.message)
      ? error.message : 'STAGING_BACKUP_FAILED');
    process.exitCode = 1;
  }
}
