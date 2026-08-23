import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
// This script lives in `scripts/`; the repository root is its parent.
const workspaceRoot = path.resolve(projectRoot, '..');

await build({
  // Use absolute paths so esbuild does not reinterpret the entrypoint as a
  // package when invoked by npm on Windows or from a sandboxed workspace.
  entryPoints: [path.join(workspaceRoot, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: path.join(workspaceRoot, 'dist', 'server.cjs')
});
