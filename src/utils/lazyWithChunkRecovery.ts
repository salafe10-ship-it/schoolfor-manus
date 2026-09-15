import React from 'react';

const CHUNK_RECOVERY_SESSION_KEY = 'edupro_chunk_recovery_attempted';

/**
 * Recover an already-open tab after a deployment replaces hashed Vite chunks.
 * The retry refreshes the current document only; it does not change routes.
 */
export function lazyWithChunkRecovery<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) {
  return React.lazy(async () => {
    try {
      const module = await loader();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CHUNK_RECOVERY_SESSION_KEY);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isStaleChunkError = /failed to fetch dynamically imported module|importing a module script failed|failed to fetch module/i.test(message);

      if (isStaleChunkError && typeof window !== 'undefined') {
        const alreadyRecovered = window.sessionStorage.getItem(CHUNK_RECOVERY_SESSION_KEY) === '1';
        if (!alreadyRecovered) {
          window.sessionStorage.setItem(CHUNK_RECOVERY_SESSION_KEY, '1');
          const refreshedUrl = new URL(window.location.href);
          refreshedUrl.searchParams.set('_asset_refresh', String(Date.now()));
          window.location.replace(refreshedUrl.toString());
          return new Promise<{ default: T }>(() => undefined);
        }
        window.sessionStorage.removeItem(CHUNK_RECOVERY_SESSION_KEY);
      }

      throw error;
    }
  });
}
