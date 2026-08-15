import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const portalSource = readFileSync(
  resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'),
  'utf8'
);

function saveHandlerBlock(): string {
  const start = portalSource.indexOf('const handleSaveStudent = async');
  const end = portalSource.indexOf('// Delete Student', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return portalSource.slice(start, end);
}

describe('STU-AFFAIRS-P1-006-19A separate atomicity UX safety', () => {
  it('does not claim composite success until both independent results are known', () => {
    const block = saveHandlerBlock();
    expect(block).toContain('guardianPersisted');
    expect(block).toContain('studentPersisted');
    expect(block).toContain('كعمليتين مستقلتين');
    expect(block).toContain('تم حفظ بيانات ولي الأمر، لكن لم تثبت نتيجة حفظ بيانات الطالب');
  });

  it('does not send Student after Guardian failure', () => {
    const block = saveHandlerBlock();
    const guardianCall = block.indexOf('StudentRepository.updateGuardian');
    const studentCall = block.indexOf('StudentRepository.saveStudent(studentPayload)');
    const guardFailure = block.indexOf('!guardianPersisted && !studentUpdateStarted');
    expect(guardianCall).toBeGreaterThan(-1);
    expect(studentCall).toBeGreaterThan(guardianCall);
    expect(guardFailure).toBeGreaterThan(guardianCall);
  });

  it('uses verification language for an unknown outcome', () => {
    const block = saveHandlerBlock();
    expect(block).toContain('أعد تحميل السجل للتحقق قبل إعادة المحاولة');
    expect(block).not.toContain('تم حفظ بيانات الطالب بنجاح');
  });
});
