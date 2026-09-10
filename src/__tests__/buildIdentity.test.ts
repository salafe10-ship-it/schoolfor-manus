import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBuildIdentity } from '../../server/infrastructure/BuildIdentity';

describe('public build identity', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('exposes only non-secret release metadata and uses unknown when absent', () => {
    vi.stubEnv('APP_VERSION', '2026.09.10');
    vi.stubEnv('RENDER_GIT_COMMIT', 'abc1234');
    vi.stubEnv('BUILD_TIMESTAMP', '2026-09-10T08:00:00Z');

    expect(getBuildIdentity()).toEqual({
      version: '2026.09.10',
      commit: 'abc1234',
      builtAt: '2026-09-10T08:00:00Z',
    });
  });
});
