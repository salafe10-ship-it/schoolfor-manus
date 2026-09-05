import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('fallback storage browser production guard', () => {
  it('recognizes non-local browser origins without importing Vite metadata into the server bundle', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/FallbackStorage.ts'), 'utf8');
    expect(file).toContain('const browserProduction = typeof window !== \'undefined\'');
    expect(file).toContain('return browserProduction ||');
    expect(file).not.toContain('(import.meta as any).env?.PROD === true');
  });
});
