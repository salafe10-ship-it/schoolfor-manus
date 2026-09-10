import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

  it('uses the generated build artifact when runtime variables are absent', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'edupro-build-identity-'));
    const artifactPath = path.join(directory, 'build-identity.json');
    fs.writeFileSync(artifactPath, JSON.stringify({ version: '1.0.0', commit: 'a'.repeat(40), builtAt: '2026-09-10T08:00:00.000Z' }));
    vi.stubEnv('BUILD_IDENTITY_PATH', artifactPath);
    vi.stubEnv('APP_VERSION', '');
    vi.stubEnv('RENDER_GIT_COMMIT', '');
    vi.stubEnv('BUILD_TIMESTAMP', '');

    expect(getBuildIdentity()).toEqual({
      version: '1.0.0',
      commit: 'a'.repeat(40),
      builtAt: '2026-09-10T08:00:00.000Z',
    });
    fs.rmSync(directory, { recursive: true, force: true });
  });
});
