import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Resolve from the config file itself so Vite/Vitest remain stable when
// launched through npm, tsx, or an IDE runner with a different cwd.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Let browser-side persistence guards distinguish an isolated local
    // Staging runtime from an ordinary localhost demo with no database.
    define: {
      __EDUPRO_ENVIRONMENT__: JSON.stringify(process.env.EDUPRO_ENVIRONMENT || ''),
    },
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
