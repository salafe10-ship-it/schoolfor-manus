// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deployCloudflare } from '../../scripts/cloudflare-deploy.mjs';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn(), spawnSync: vi.fn() }));

const commit = 'a'.repeat(40);
const builtAt = '2026-10-01T12:00:00.000Z';
const statusArgs = ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'];
const successfulProcess = { status: 0, stdout: '', stderr: '', output: [], pid: 1, signal: null };

describe('Cloudflare deployment requires clean tracked source', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(builtAt);
    vi.stubEnv('APP_VERSION', 'release-test');
    vi.stubEnv('GIT_COMMIT_SHA', 'stale-git-commit');
    vi.stubEnv('BUILD_COMMIT_SHA', 'stale-build-commit');
    vi.mocked(execFileSync).mockImplementation((_command, args) => (
      args?.includes('status') ? '' : commit
    ));
    vi.mocked(spawnSync).mockReturnValue(successfulProcess);
    vi.spyOn(fs, 'readFileSync').mockImplementation((file) => {
      if (String(file) === path.join(process.cwd(), 'package.json')) return JSON.stringify({ version: '1.0.0' });
      if (String(file) === path.join(process.cwd(), 'dist', 'build-identity.json')) {
        return JSON.stringify({ commit, version: 'release-test', builtAt });
      }
      throw new Error('Unexpected file read');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it.each([' M server.ts', 'M  server.ts', 'A  src/new.ts', ' D server.ts', 'R  old.ts -> new.ts'])(
    'blocks tracked status %s before building or deploying', (status) => {
      vi.mocked(execFileSync).mockReturnValue(status);
      expect(() => deployCloudflare()).toThrow('توجد تغييرات في ملفات متتبعة');
      expect(spawnSync).not.toHaveBeenCalled();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    },
  );

  it('ignores untracked audit files and builds and verifies the exact HEAD before deploying', () => {
    expect(deployCloudflare()).toBe(0);
    expect(execFileSync).toHaveBeenCalledWith('git', statusArgs, expect.objectContaining({ cwd: process.cwd() }));
    const calls = vi.mocked(spawnSync).mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[0][0]).toBe(process.platform === 'win32' ? 'npm.cmd' : 'npm');
    expect(calls[0][1]).toEqual(['run', 'build']);
    expect(calls[1][0]).toBe(process.execPath);
    expect(calls[1][1]).toEqual(['scripts/verify-build-artifact.mjs']);
    for (const call of calls) {
      expect(call[2]).toMatchObject({
        env: { GIT_COMMIT_SHA: commit, BUILD_COMMIT_SHA: commit, APP_VERSION: 'release-test', BUILD_TIMESTAMP: builtAt },
      });
    }
    expect(calls[2][1]).toEqual(expect.arrayContaining([
      'wrangler', 'deploy', '--keep-vars', `BUILD_COMMIT_SHA:${commit}`, `BUILD_TIMESTAMP:${builtAt}`,
      `__EDUPRO_BUILD_COMMIT__:'${commit}'`,
    ]));
    expect(execFileSync).toHaveBeenCalledTimes(4);
    expect(calls[2][2]).toMatchObject({ shell: process.platform === 'win32' });
  });

  it('uses the artifact timestamp for Worker identity when the server builder generates its own timestamp', () => {
    const artifactTime = '2026-10-01T12:00:05.000Z';
    vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({ version: '1.0.0' }))
      .mockReturnValueOnce(JSON.stringify({ commit, version: 'release-test', builtAt: artifactTime }));
    expect(deployCloudflare()).toBe(0);
    expect(vi.mocked(spawnSync).mock.calls[2][1]).toEqual(expect.arrayContaining([
      `BUILD_TIMESTAMP:${artifactTime}`, `__EDUPRO_BUILD_TIMESTAMP__:'${artifactTime}'`,
    ]));
  });

  it.each([0, 1])('does not deploy when build or artifact verification step %s fails', (step) => {
    if (step === 1) vi.mocked(spawnSync).mockReturnValueOnce(successfulProcess);
    vi.mocked(spawnSync).mockReturnValueOnce({ ...successfulProcess, status: 7 });
    expect(deployCloudflare()).toBe(7);
    expect(spawnSync).toHaveBeenCalledTimes(step + 1);
  });

  it.each([
    { commit: 'b'.repeat(40), version: 'release-test', builtAt },
    { commit, version: 'stale-version', builtAt },
    { commit, version: 'release-test', builtAt: 'unknown' },
  ])('rejects a mismatched or invalid artifact identity: %j', (artifact) => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({ version: '1.0.0' }))
      .mockReturnValueOnce(JSON.stringify(artifact));
    expect(() => deployCloudflare()).toThrow('هوية ملف البناء لا تطابق');
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it('blocks tracked changes made during the build', () => {
    vi.mocked(execFileSync).mockReturnValueOnce('').mockReturnValueOnce(commit).mockReturnValueOnce(' M server.ts');
    expect(() => deployCloudflare()).toThrow('توجد تغييرات في ملفات متتبعة');
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it('blocks a HEAD change made during the build', () => {
    vi.mocked(execFileSync).mockReturnValueOnce('').mockReturnValueOnce(commit)
      .mockReturnValueOnce('').mockReturnValueOnce('b'.repeat(40));
    expect(() => deployCloudflare()).toThrow('تغير التزام Git أثناء البناء');
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it('fails closed if Git cannot determine tracked source status', () => {
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('Git unavailable'); });
    expect(() => deployCloudflare()).toThrow('Git unavailable');
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it('fails closed if the build process cannot start', () => {
    vi.mocked(spawnSync).mockReturnValueOnce({ ...successfulProcess, status: null, error: new Error('Build unavailable') });
    expect(() => deployCloudflare()).toThrow('Build unavailable');
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });
});
