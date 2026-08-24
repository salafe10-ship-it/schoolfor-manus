import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/StudentAffairsPortal.tsx', 'utf8');

describe('Student Affairs registration form contract', () => {
  it('exposes the required canonical registration status field', () => {
    expect(source).toContain('value={formData.status}');
    expect(source).toContain('<option value="active">نشط ومنتظم</option>');
    expect(source).toContain('<option value="suspended">موقوف القيد</option>');
    expect(source).toContain('<option value="inactive">منسحب / منقول</option>');
  });

  it('prints the student-list preview from the full-screen report view', () => {
    expect(source).toContain('const handlePrintStudentsPreview = () => {');
    expect(source).toContain('window.focus();');
    expect(source).toContain('window.print();');
    expect(source).toContain("if (typeof window.print !== 'function') {");
    expect(source).toContain('المتصفح الداخلي لا يدعم تشغيل الطابعة مباشرة');
    expect(source).toContain('aria-label="طباعة كشف الطلاب من المعاينة"');
    expect(source).toContain('const handleDownloadPrintableStudents = () => {');
    expect(source).toContain('aria-label="تنزيل كشف الطلاب للطباعة"');
    expect(source).toContain('كشف الطلاب بصيغة HTML جاهزة للطباعة');
    expect(source).toContain('تم إرسال أمر الطباعة. إذا لم تظهر نافذة الطابعة، استخدم Ctrl+P ثم اختر الطابعة واضغط طباعة.');
    expect(source).toContain('role="status"');
    expect(source).toContain('fixed inset-0 z-[100] bg-[#fffefc]');
    expect(source).toContain('student-print-preview');
    expect(source).toContain('aria-label="خروج من معاينة كشف الطلاب"');
    expect(source).toContain('body * { visibility: hidden !important; }');
    expect(source).not.toContain("const printUrl = URL.createObjectURL(printBlob);");
    expect(source).not.toContain("const printWindow = window.open(printUrl, '_blank');");
    expect(source).not.toContain("onClick={() => { window.print(); triggerNotification('تم إرسال المعاينة إلى أمر الطباعة.', 'info'); }}");
  });

  it('keeps suspend and re-enroll actions reversible from the student list', () => {
    expect(source).toContain("const isSuspended = String(student.status) === 'suspended';");
    expect(source).toContain("const newStatus = isSuspended ? 'active' : 'suspended';");
    expect(source).toContain('هل تريد ${actionLabel} للطالب');
    expect(source).toContain("disabled={!canWriteStudents}");
    expect(source).not.toContain('إعادة القيد ليست عودة مباشرة');
  });
});
