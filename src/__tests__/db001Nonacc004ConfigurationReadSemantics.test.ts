import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(process.cwd(), 'src/database/repositories/ConfigurationRepository.ts'),
  'utf8'
);

describe('DB-001-NONACC-004 configuration read semantics', () => {
  it('keeps missing configuration distinct from source failure', () => {
    const start = source.indexOf('public async getEffectiveConfig');
    const end = source.indexOf('public async saveConfig', start);
    const method = source.slice(start, end);

    expect(method).toContain('if (error) throw error;');
    expect(method).toContain('data && data.length > 0 ? data[0].value : null');
    expect(method).toContain('throw err;');
    expect(method).not.toMatch(/catch \(err: any\)[\s\S]*return null;/);
  });

  it('does not add a fallback read or a new error code', () => {
    expect(source).not.toContain('FallbackStorage');
    expect(source).not.toContain('errorCode');
  });
});
