import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// This script lives in `scripts/`; the repository root is its parent.
const workspaceRoot = path.resolve(projectRoot, '..');

// Invoke the official esbuild CLI through the current Node runtime. The JS API
// can be rejected by restricted Windows runners when it normalizes workspace
// paths before the esbuild service starts; the CLI keeps the working directory
// and entrypoint semantics identical to Render's build environment.
const esbuildCli = path.join(workspaceRoot, 'node_modules', 'esbuild', 'bin', 'esbuild');
const result = spawnSync(process.execPath, [
  esbuildCli,
  '././server.ts',
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--packages=external',
  '--sourcemap',
  '--outfile=././dist/server.cjs'
], { cwd: workspaceRoot, stdio: 'inherit', shell: false });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
