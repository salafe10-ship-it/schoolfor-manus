import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('HR form truthfulness', () => {
  it('opens compensation and evaluation forms without synthetic values', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    expect(source).toContain("amount: 0");
    expect(source).toContain("score: 0, reviewer: ''");
    expect(source).not.toContain('amount: 1500');
    expect(source).not.toContain('score: 85');
    expect(source).not.toContain('المدير العام أ. سليمان غازي');
  });
});
