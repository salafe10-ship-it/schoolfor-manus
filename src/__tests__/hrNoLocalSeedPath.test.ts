import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('HR canonical source guard', () => {
  it('short-circuits before localStorage or seed data can populate HR records', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
    const effectStart = source.indexOf('useEffect(() => {', source.indexOf('// 1. Initial State Seeding'));
    const canonicalGuard = source.indexOf('return;', effectStart);
    const localStorageRead = source.indexOf("localStorage.getItem('erp_hr_departments')", effectStart);
    expect(effectStart).toBeGreaterThan(-1);
    expect(canonicalGuard).toBeGreaterThan(effectStart);
    expect(localStorageRead).toBeGreaterThan(canonicalGuard);
    expect(source).toContain('المصدر المركزي وحده يملك');
  });
});
