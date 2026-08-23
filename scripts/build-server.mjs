import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// This script lives in `scripts/`; the repository root is its parent.
const workspaceRoot = path.resolve(projectRoot, '..');

await build({
  absWorkingDir: workspaceRoot,
  entryPoints: ['./server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: './dist/server.cjs'
});
