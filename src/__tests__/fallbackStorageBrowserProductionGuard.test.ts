import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('fallback storage browser production guard', () => {
  it('recognizes Vite production bundles as canonical persistence mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/database/repositories/FallbackStorage.ts'), 'utf8');
    expect(file).toContain("(import.meta as any).env?.PROD === true");
    expect(file).toContain('return viteProduction ||');
  });
});
