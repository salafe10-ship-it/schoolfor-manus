import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('school branding payload safety', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

  it('raises the bounded JSON limit only for school branding uploads', () => {
    expect(server).toContain("req.method === 'PUT' && req.path === '/api/school/branding'");
    expect(server).toContain('3 * 1024 * 1024');
    expect(server).toContain(': 2 * 1024 * 1024');
  });

  it('preserves saved stage logos when an update omits those keys', () => {
    expect(server).toContain('if (!Object.prototype.hasOwnProperty.call(requestedStageLogos, stage)) continue;');
    expect(server).toContain('const currentStageLogos = readObject(currentBranding.stageLogos);');
    expect(server).toContain('const existingLogo = String(currentStageLogos[stage] || \'\').trim();');
  });
});
