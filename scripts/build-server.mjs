import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// This script lives in `scripts/`; the repository root is its parent.
const workspaceRoot = path.resolve(projectRoot, '..');

// The package's CLI is a JavaScript launcher on Windows, but can be a native
// executable on Linux. Render must therefore execute it directly instead of
// asking Node to parse a native ELF binary as JavaScript.
const esbuildCli = path.join(workspaceRoot, 'node_modules', 'esbuild', 'bin', 'esbuild');
const serverEntry = path.join(workspaceRoot, 'server.ts');
const serverOutput = path.join(workspaceRoot, 'dist', 'server.cjs');
const cliArgs = [
  esbuildCli,
  serverEntry,
  '--bundle',
  '--platform=node',
  '--format=cjs',
  '--packages=external',
  // Vite's import.meta.env is a browser-only compile-time contract. The
  // bundled server must not evaluate it at runtime; production behavior is
  // driven by the explicit Node environment variables instead.
  '--define:import.meta.env.PROD=false',
  '--sourcemap',
  `--outfile=${serverOutput}`
];

const command = process.platform === 'win32' ? process.execPath : esbuildCli;
const commandArgs = process.platform === 'win32' ? cliArgs : cliArgs.slice(1);
const result = spawnSync(command, commandArgs, {
  cwd: workspaceRoot,
  stdio: 'inherit',
  shell: false
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
