import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('HR compensation approval integrity', () => {
  it('keeps penalties and rewards pending until explicit approval', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    const types = readFileSync(resolve(process.cwd(), 'src/components/hr/types.ts'), 'utf8');
    expect(source).toContain("status: 'pending'");
    expect(types).toContain("status: 'pending' | 'applied' | 'waived'");
    expect(types).toContain("status: 'pending' | 'applied' | 'paid'");
  });
});
