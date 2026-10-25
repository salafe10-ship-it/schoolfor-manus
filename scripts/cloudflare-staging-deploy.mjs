import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'wrangler.staging.jsonc');

export function validateStagingWorkerConfig(config, { bootstrap = false, accessVerified = false } = {}) {
  if (config.name !== 'schoolfor-manus-staging'
    || config.account_id !== '8eac6ae301c11ce0e6869933e5d53061'
    || config.vars?.EDUPRO_ENVIRONMENT !== 'staging'
    || config.vars?.SUPABASE_URL !== 'https://vjcjscqgmijgzagshsca.supabase.co'
    || config.vars?.DATABASE_ROLE_EXPECTED !== 'edupro_staging_app') {
    throw new Error('STAGING_WORKER_IDENTITY_MISMATCH');
  }
  if (config.routes?.length || config.route || config.env
    || config.vars?.FINANCIAL_WRITES_LOCKED !== 'true') {
    throw new Error('STAGING_DEPLOY_REQUIRES_NO_CUSTOM_ROUTES_AND_LOCKED_FINANCIAL_WRITES');
  }
  if (config.preview_urls !== false) throw new Error('STAGING_WORKER_PREVIEW_URLS_MUST_REMAIN_DISABLED');
  if (config.workers_dev !== false && !accessVerified) {
    throw new Error('STAGING_WORKER_ACCESS_MUST_BE_VERIFIED_BEFORE_PUBLIC_HOSTNAME');
  }
  if (Object.keys(config.vars).some((key) => /DATABASE_URL|DIRECT_URL|SERVICE_ROLE|JWT_SECRET|BEARER_TOKEN|SIGNING_SECRET/.test(key))) {
    throw new Error('STAGING_RUNTIME_CREDENTIALS_MUST_BE_SECRETS');
  }
  if (config.hyperdrive?.length) {
    // Each binding must have an independently verified, versioned origin.
    const identity = JSON.parse(fs.readFileSync(path.join(root,
      'docs/infrastructure/staging-resource-identity.json'), 'utf8'));
    for (const binding of config.hyperdrive) {
      const verified = identity.hyperdrive?.find((item) => item.id === binding.id && item.binding === binding.binding);
      if (!verified || verified.projectRef !== 'vjcjscqgmijgzagshsca'
        || (binding.binding === 'HYPERDRIVE' && verified.role !== 'edupro_staging_app')) {
        throw new Error('STAGING_HYPERDRIVE_ORIGIN_NOT_VERIFIED');
      }
    }
  } else if (!bootstrap) {
    throw new Error('STAGING_DATABASE_BINDINGS_REQUIRED_OR_USE_BOOTSTRAP');
  }
}

export function deployStagingWorker({ bootstrap = false } = {}) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const identity = JSON.parse(fs.readFileSync(path.join(root,
    'docs/infrastructure/staging-resource-identity.json'), 'utf8'));
  validateStagingWorkerConfig(config, { bootstrap,
    accessVerified: identity.access?.verified === true && identity.access?.scope === 'worker-all-traffic' });
  const git = (args) => execFileSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8' }).trim();
  if (git(['status', '--porcelain', '--untracked-files=all'])) throw new Error('STAGING_DEPLOY_REQUIRES_COMMITTED_SOURCE');
  const commit = git(['rev-parse', 'HEAD']);
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  const builtAt = new Date().toISOString();
  const environment = { ...process.env, GIT_COMMIT_SHA: commit, BUILD_COMMIT_SHA: commit,
    APP_VERSION: version, BUILD_TIMESTAMP: builtAt };
  // Server credentials are runtime bindings; do not pass them into a build.
  for (const key of Object.keys(environment)) {
    if (/DATABASE_URL|DIRECT_URL|SERVICE_ROLE|JWT_SECRET|BEARER_TOKEN|SIGNING_SECRET/.test(key)) delete environment[key];
  }
  const run = (script, args = []) => {
    const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
      cwd: root, env: environment, stdio: 'inherit', windowsHide: true,
    });
    if (result.status !== 0 || result.error) throw new Error('STAGING_BUILD_OR_DEPLOY_FAILED');
  };
  run('node_modules/vite/bin/vite.js', ['build', '--configLoader', 'runner']);
  run('scripts/build-server.mjs');
  run('scripts/verify-build-artifact.mjs');
  if (git(['rev-parse', 'HEAD']) !== commit || git(['status', '--porcelain', '--untracked-files=all'])) {
    throw new Error('STAGING_SOURCE_CHANGED_DURING_BUILD');
  }
  const artifact = JSON.parse(fs.readFileSync(path.join(root, 'dist/build-identity.json'), 'utf8'));
  if (artifact.commit !== commit || artifact.version !== version) throw new Error('STAGING_BUILD_IDENTITY_MISMATCH');
  run('node_modules/wrangler/bin/wrangler.js', ['deploy', '--config', configPath, '--keep-vars',
    '--var', `BUILD_COMMIT_SHA:${commit}`, '--var', `APP_VERSION:${version}`, '--var', `BUILD_TIMESTAMP:${builtAt}`,
    '--define', `__EDUPRO_BUILD_COMMIT__:${JSON.stringify(commit)}`,
    '--define', `__EDUPRO_BUILD_VERSION__:${JSON.stringify(version)}`,
    '--define', `__EDUPRO_BUILD_TIMESTAMP__:${JSON.stringify(builtAt)}`]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some((arg) => arg !== '--bootstrap')) throw new Error('STAGING_DEPLOY_ARGUMENT_NOT_ALLOWED');
    deployStagingWorker({ bootstrap: process.argv.includes('--bootstrap') });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'STAGING_DEPLOY_FAILED');
    process.exitCode = 1;
  }
}
