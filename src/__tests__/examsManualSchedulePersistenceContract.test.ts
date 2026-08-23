import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('manual exam schedule persistence contract', () => {
  it('confirms a manual schedule only after central persistence', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ الاختبار اليدوي في المصدر المركزي');
    expect(source).toContain('const persisted = await saveToServerDb(');
  });
});
