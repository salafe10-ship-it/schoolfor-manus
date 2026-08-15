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

describe('STU-AFFAIRS-P1-UI-007 guardian save false-success containment', () => {
  it('does not render a pre-save success claim in the modal', () => {
    expect(portalSource).toContain('لم يتم حفظ هذه البيانات بعد. احفظ السجل أولاً لتأكيدها.');
    expect(portalSource).not.toContain('تم حفظ وتأكيد البيانات الأساسية لولي الأمر والطالب بنجاح.');
  });

  it('keeps success notifications after awaited canonical responses', () => {
    const block = saveHandlerBlock();
    const guardianAwait = block.indexOf('guardianUpdateResult = await StudentRepository.updateGuardian');
    const studentAwait = block.indexOf('const response = await StudentRepository.saveStudent(studentPayload)');
    const successNotification = block.lastIndexOf("'success'");
    expect(guardianAwait).toBeGreaterThan(-1);
    expect(studentAwait).toBeGreaterThan(guardianAwait);
    expect(successNotification).toBeGreaterThan(studentAwait);
    expect(successNotification).toBeGreaterThan(studentAwait);
  });

  it('retains explicit failure handling for non-success and unknown outcomes', () => {
    const block = saveHandlerBlock();
    expect(block).toContain('تعذر إثبات نتيجة تحديث ولي الأمر');
    expect(block).toContain('لم تثبت نتيجة حفظ بيانات الطالب');
    expect(block).toContain('تعذر حفظ سجل الطالب في الخادم');
  });
});
