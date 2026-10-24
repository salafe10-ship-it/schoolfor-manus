import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const runnerPath = path.join(projectRoot, 'scripts', 'run-isolated-tests.mjs');
const cleanEnvironment = {
  PATH: process.env.PATH || '',
  SystemRoot: process.env.SystemRoot || '',
  TEMP: process.env.TEMP || '',
  TMP: process.env.TMP || '',
};

describe('isolated test runner guard', () => {
  it('accepts a project-root run with no external credentials', () => {
    const result = spawnSync(process.execPath, [runnerPath, '--check-only'], {
      cwd: projectRoot,
      env: cleanEnvironment,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('ISOLATED_TEST_GUARD_OK');
  });

  it('blocks inherited database credentials without printing their values', () => {
    const secretSentinel = 'do-not-print-test-database-secret';
    const result = spawnSync(process.execPath, [runnerPath, '--check-only'], {
      cwd: projectRoot,
      env: { ...cleanEnvironment, DATABASE_URL: `postgresql://user:${secretSentinel}@production.invalid/db` },
      encoding: 'utf8',
    });

    expect(result.status).toBe(2);
    expect(`${result.stdout}\n${result.stderr}`).toContain('DATABASE_URL');
    expect(`${result.stdout}\n${result.stderr}`).not.toContain(secretSentinel);
  });
});
