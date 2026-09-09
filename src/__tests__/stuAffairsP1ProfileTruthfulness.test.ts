import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/StudentAffairsPortal.tsx'), 'utf8');

function saveBlock(): string {
  const start = source.indexOf('const studentPayload: any = {');
  const end = source.indexOf('try {', start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('STU-AFFAIRS-P1-006-28 Student Profile UI truthfulness', () => {
  it('does not create a synthetic Student email or project Guardian phone into Student phone state', () => {
    expect(source).not.toContain('@school-erp.edu');
    expect(source).toContain("phone: '',");
    expect(source).not.toContain('phone: student.parentPhone ||');
  });

  it('sends only canonical Student fields and persists the supported national ID', () => {
    const block = saveBlock();
    expect(block).toContain('nationalId: formData.nationalId');
    expect(block).not.toContain('religion: formData.religion');
    expect(block).not.toContain('address: formData.address');
    expect(block).not.toContain('email: formData.email');
  });

  it('makes unsupported identity and Enrollment-owned placement controls visibly non-editable', () => {
    expect(source).toContain('رقم الهوية الوطنية');
    expect(source).toContain('المرحلة الدراسية <span className="text-emerald-700">(يُدار عبر الالتحاق)</span>');
    expect(source).toContain('الصف الدراسي <span className="text-emerald-700">(يُدار عبر الالتحاق)</span>');
    expect(source).toContain('{sectionFieldLabel} <span className="text-emerald-700">(يُدار عبر الالتحاق)</span>');
    expect(source).toContain('sectionTermForSchool(selectedSchool.id)');
    expect(source.match(/\bdisabled\b/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('limits success messaging to the actual canonical persistence scope', () => {
    expect(source).toContain('تم الحفظ بنجاح');
    expect(source).not.toContain('تم حفظ جميع بيانات الطالب بنجاح');
  });
});
