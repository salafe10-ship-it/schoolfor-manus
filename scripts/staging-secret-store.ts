import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { restrictFilePermissions, validateStagingEnvironmentValues } from './prepare-staging-env.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dpapiScript = path.join(root, 'scripts', 'staging-dpapi.ps1');

export function defaultStagingVaultDirectory(): string {
  if (process.platform !== 'win32') throw new Error('STAGING_VAULT_REQUIRES_WINDOWS_DPAPI');
  return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'EduPro', 'schoolfor-manus', 'staging');
}

function requireRegularFile(file: string): void {
  if (!fs.lstatSync(file).isFile()) throw new Error('STAGING_SECRET_SOURCE_MUST_BE_A_REGULAR_FILE');
}

function preparePrivateDirectory(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('STAGING_VAULT_SYMLINK_REFUSED');
  restrictFilePermissions(directory);
}

function runDpapi(action: 'seal' | 'open', source: string, destination: string): void {
  if (process.platform !== 'win32') throw new Error('STAGING_VAULT_REQUIRES_WINDOWS_DPAPI');
  try {
    // Invoke the repository-owned commands without changing system or user
    // execution policy. Paths are environment values, never shell source.
    const command = `& { ${fs.readFileSync(dpapiScript, 'utf8')} } -Action $env:EDUPRO_DPAPI_ACTION -Source $env:EDUPRO_DPAPI_SOURCE -Destination $env:EDUPRO_DPAPI_DESTINATION`;
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true, stdio: 'pipe', timeout: 30_000,
      env: { ...process.env, EDUPRO_DPAPI_ACTION: action,
        EDUPRO_DPAPI_SOURCE: source, EDUPRO_DPAPI_DESTINATION: destination },
    });
  } catch {
    throw new Error('STAGING_VAULT_ENCRYPTION_OR_ACCOUNT_CHECK_FAILED');
  }
}

export function saveStagingSecrets(envFile = path.join(root, '.env.staging'),
  vaultDirectory = defaultStagingVaultDirectory()): void {
  requireRegularFile(envFile);
  validateStagingEnvironmentValues(dotenv.parse(fs.readFileSync(envFile)));
  restrictFilePermissions(envFile);
  preparePrivateDirectory(vaultDirectory);
  const temporary = path.join(vaultDirectory, `environment-${randomUUID()}.tmp`);
  try {
    runDpapi('seal', envFile, temporary);
    restrictFilePermissions(temporary);
    fs.renameSync(temporary, path.join(vaultDirectory, 'environment.dpapi'));
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

export function restoreStagingSecrets(envFile = path.join(root, '.env.staging'),
  vaultDirectory = defaultStagingVaultDirectory()): 'restored' | 'preserved' {
  const encrypted = path.join(vaultDirectory, 'environment.dpapi');
  if (!fs.existsSync(encrypted)) throw new Error('STAGING_VAULT_NOT_INITIALIZED');
  requireRegularFile(encrypted);
  preparePrivateDirectory(vaultDirectory);
  // Plaintext is created only in the ACL-restricted vault, then validated.
  const temporary = path.join(vaultDirectory, `.environment-${randomUUID()}.env`);
  try {
    runDpapi('open', encrypted, temporary);
    restrictFilePermissions(temporary);
    const recovered = fs.readFileSync(temporary);
    validateStagingEnvironmentValues(dotenv.parse(recovered));
    if (fs.existsSync(envFile)) {
      requireRegularFile(envFile);
      if (!fs.readFileSync(envFile).equals(recovered)) throw new Error('STAGING_LOCAL_ENV_DIFFERS_FROM_VAULT');
      restrictFilePermissions(envFile);
      return 'preserved';
    }
    fs.copyFileSync(temporary, envFile, fs.constants.COPYFILE_EXCL);
    restrictFilePermissions(envFile);
    return 'restored';
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'save') {
      saveStagingSecrets();
      console.info('Staging credentials validated and saved with Windows CurrentUser DPAPI outside the repository.');
    } else if (process.argv[2] === 'restore') {
      const result = restoreStagingSecrets();
      console.info(`Staging environment ${result} from the protected store; secret values were not printed.`);
    } else {
      throw new Error('USAGE: npm run staging:save | npm run staging:restore');
    }
  } catch (error) {
    console.error(error instanceof Error && error.message.startsWith('STAGING_')
      ? error.message : 'STAGING_SECRET_STORE_FAILED');
    process.exitCode = 1;
  }
}
