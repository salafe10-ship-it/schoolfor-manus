import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // UI workflow tests can exceed Vitest's 5-second default when the full
    // suite runs concurrently on resource-constrained Windows/CI workers.
    testTimeout: 15_000,
    // The workspace may contain user-owned Codex worktrees. They are not
    // part of this package and must not be discovered as duplicate tests.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.codex-worktrees/**', '**/.wrangler/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
