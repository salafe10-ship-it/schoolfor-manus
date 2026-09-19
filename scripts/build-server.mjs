import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// This script lives in `scripts/`; the repository root is its parent.
const workspaceRoot = path.resolve(projectRoot, '..');

// Use normalized absolute paths for the esbuild API. The Windows launcher can
// treat a repository-relative entry such as `./server.ts` as a package path
// when invoked through npm, which makes the server build fail even though the
// file exists. Absolute paths are unambiguous for the API and remain portable
// because they are derived from the current workspace.
const serverEntry = path.resolve(workspaceRoot, 'server.ts');
const serverOutput = path.resolve(workspaceRoot, 'dist', 'server.cjs');
const buildIdentityPath = path.join(workspaceRoot, 'dist', 'build-identity.json');
const packageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
const commitFromEnvironment = [
  'RENDER_GIT_COMMIT',
  'RENDER_GIT_COMMIT_SHA',
  'GIT_COMMIT_SHA',
  'BUILD_COMMIT_SHA',
].map((key) => process.env[key]?.trim()).find(Boolean);
const commitFromGit = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: workspaceRoot,
  encoding: 'utf8',
  windowsHide: true,
}).stdout?.trim();
const buildIdentity = {
  version: String(process.env.APP_VERSION || packageJson.version || 'unknown').trim(),
  commit: commitFromEnvironment || commitFromGit || 'unknown',
  builtAt: new Date().toISOString(),
};
fs.mkdirSync(path.dirname(buildIdentityPath), { recursive: true });
fs.writeFileSync(buildIdentityPath, `${JSON.stringify(buildIdentity, null, 2)}\n`, 'utf8');
await build({
  absWorkingDir: workspaceRoot,
  entryPoints: [serverEntry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: serverOutput,
  logLevel: 'info',
});
