import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export function deployCloudflare() {
  const root = process.cwd();
  const git = (args) => execFileSync('git', ['--no-optional-locks', ...args], {
    cwd: root, encoding: 'utf8',
  }).trim();
  const requireCleanTrackedSource = () => {
    // Local audit evidence is untracked and must not block a release.
    if (git(['status', '--porcelain', '--untracked-files=no'])) {
      throw new Error('تعذر النشر: توجد تغييرات في ملفات متتبعة بواسطة Git. احفظ التغييرات في التزام قبل النشر؛ الملفات المحلية غير المتتبعة لا تمنع النشر.');
    }
  };
  requireCleanTrackedSource();
  const commit = git(['rev-parse', 'HEAD']);
  if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error('تعذر النشر: معرف التزام Git غير صالح.');

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const builtAt = new Date().toISOString();
  const version = String(process.env.APP_VERSION || packageJson.version || '0.0.0').trim();
  const releaseEnv = {
    ...process.env,
    // The server builder prefers GIT_COMMIT_SHA over BUILD_COMMIT_SHA.
    // Override both so a stale inherited value cannot mislabel this artifact.
    GIT_COMMIT_SHA: commit,
    BUILD_COMMIT_SHA: commit,
    APP_VERSION: version,
    BUILD_TIMESTAMP: builtAt,
  };
  const run = (command, args, shell = false) => {
    const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: releaseEnv, shell });
    if (result.error) throw result.error;
    return result.status ?? 1;
  };
  const windows = process.platform === 'win32';
  // The npm predeploy hook only builds the SPA. Rebuild the complete release
  // after the source guard, with this exact HEAD's identity, before publishing.
  const buildStatus = run(windows ? 'npm.cmd' : 'npm', ['run', 'build'], windows);
  if (buildStatus !== 0) return buildStatus;
  const artifactStatus = run(process.execPath, ['scripts/verify-build-artifact.mjs']);
  if (artifactStatus !== 0) return artifactStatus;
  const artifact = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'build-identity.json'), 'utf8'));
  if (artifact.commit !== commit || artifact.version !== version || !Number.isFinite(Date.parse(artifact.builtAt))) {
    throw new Error('تعذر النشر: هوية ملف البناء لا تطابق التزام Git وإصدار النشر الحاليين.');
  }
  requireCleanTrackedSource();
  if (git(['rev-parse', 'HEAD']) !== commit) throw new Error('تعذر النشر: تغير التزام Git أثناء البناء. أعد البناء من المصدر الحالي.');

  const defineLiteral = (value) => `'${value.replaceAll("'", "\\'")}'`;
  const args = [
    'wrangler', 'deploy', '--keep-vars',
    '--var', `APP_VERSION:${version}`,
    '--var', `BUILD_COMMIT_SHA:${commit}`,
    '--var', `BUILD_TIMESTAMP:${artifact.builtAt}`,
    '--define', `__EDUPRO_BUILD_VERSION__:${defineLiteral(version)}`,
    '--define', `__EDUPRO_BUILD_COMMIT__:${defineLiteral(commit)}`,
    '--define', `__EDUPRO_BUILD_TIMESTAMP__:${defineLiteral(artifact.builtAt)}`,
  ];
  // Windows launches .cmd shims through the shell; without this Node reports
  // EINVAL before Wrangler gets a chance to run.
  return run(windows ? 'npx.cmd' : 'npx', args, windows);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(deployCloudflare());
}
