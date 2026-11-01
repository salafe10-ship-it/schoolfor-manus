import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('manual exam schedule persistence contract', () => {
  it('confirms a manual schedule only after central persistence', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ الاختبار اليدوي في المصدر المركزي');
    expect(source).toContain('const persisted = await saveToServerDb(');
  });

  it('associates the manual schedule controls with accessible labels and native time validation', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    for (const id of [
      'manual-exam-classroom',
      'manual-exam-subject',
      'manual-exam-date',
      'manual-exam-start-time',
      'manual-exam-end-time',
      'manual-exam-hall',
      'manual-exam-proctor',
    ]) {
      expect(source).toContain(`htmlFor="${id}"`);
      expect(source).toContain(`id="${id}"`);
    }
    expect(source).toContain('type="time"');
    expect(source).toContain('لا يوجد مراقبون متاحون');
  });

  it('exposes an explicit academic level for nonstandard staging class codes and validates it server-side', () => {
    const portal = readFileSync('src/components/AcademicAffairsPortal.tsx', 'utf8');
    const server = readFileSync('server.ts', 'utf8');
    expect(portal).toContain('المرحلة الأكاديمية للصف');
    expect(portal).toContain('value="middle"');
    expect(portal).toContain('value="high"');
    expect(server).toContain("const supportedLevels = new Set(['kindergarten', 'primary', 'middle', 'high'])");
    expect(server).toContain('حدد المرحلة الأكاديمية للشعبة');
    expect(server).toContain('level: explicitLevel');
  });
});
