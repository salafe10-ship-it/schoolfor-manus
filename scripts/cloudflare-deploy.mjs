import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

const commit = git(['rev-parse', 'HEAD']);
const builtAt = new Date().toISOString();
const version = String(process.env.APP_VERSION || packageJson.version || '0.0.0').trim();
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  'wrangler', 'deploy', '--keep-vars',
  '--var', `APP_VERSION:${version}`,
  '--var', `BUILD_COMMIT_SHA:${commit}`,
  '--var', `BUILD_TIMESTAMP:${builtAt}`,
  '--define', `__EDUPRO_BUILD_VERSION__:${JSON.stringify(version)}`,
  '--define', `__EDUPRO_BUILD_COMMIT__:${JSON.stringify(commit)}`,
  '--define', `__EDUPRO_BUILD_TIMESTAMP__:${JSON.stringify(builtAt)}`,
];

const result = spawnSync(npx, args, {
  cwd: root,
  stdio: 'inherit',
  // Windows launches .cmd shims through the shell; without this Node reports
  // EINVAL before Wrangler gets a chance to run.
  shell: process.platform === 'win32',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
