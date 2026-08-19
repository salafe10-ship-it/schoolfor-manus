import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(projectRoot, '..');

await build({
  entryPoints: [path.join(workspaceRoot, 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: path.join(workspaceRoot, 'dist', 'server.cjs')
});
