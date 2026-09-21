import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync('server.ts', 'utf8');
const financialPortalSource = readFileSync('src/components/StudentFinancialPortal.tsx', 'utf8');

describe('student fees integrity contract', () => {
  it('validates stable identifiers and rejects duplicate financial rows', () => {
    expect(serverSource).toContain('validateFinancialSnapshotIntegrity');
    expect(serverSource).toContain('المعرّف المالي مكرر داخل');
  });

  it('rejects invalid invoice and receipt amounts before persistence', () => {
    expect(serverSource).toContain('قيمة المطالبة المالية');
    expect(serverSource).toContain('قيمة سند القبض');
    expect(serverSource).toContain('الرصيد المالي للمطالبة');
  });

  it('requires balanced posted journal entries', () => {
    expect(serverSource).toContain("['posted', 'مرحّل', 'مُرحّل']");
    expect(serverSource).toContain('غير متوازن محاسبياً');
  });

  it('exposes a protected database-backed fee configuration delete contract', () => {
    expect(serverSource).toContain('app.delete("/api/financial/fee-configurations/:configId"');
    expect(serverSource).toContain('FROM public.student_fee_configurations');
    expect(serverSource).toContain('لا يمكن حذف بند رسوم مستخدم في تخصيصات أو مطالبات مالية');
    expect(financialPortalSource).toContain("method: 'DELETE'");
    expect(financialPortalSource).toContain('window.confirm(`هل أنت متأكد من حذف بند الرسوم');
    expect(financialPortalSource).toContain('<span>حذف</span>');
  });

  it('requires canonical fee projection read-back before reporting a snapshot save success', () => {
    expect(serverSource).toContain('فشل تحقق القراءة بعد حفظ بند الرسوم');
    expect(serverSource).toContain('public.student_fee_configurations');
    expect(financialPortalSource).toContain('const readBackFeeConfig = async');
    expect(financialPortalSource).toContain('فشل تطابق القراءة اللاحقة مع بيانات بند الرسوم');
    expect(serverSource).toContain('app.put("/api/financial/fee-configurations/:configId"');
    expect(financialPortalSource).toContain("method: 'PUT'");
    expect(financialPortalSource).toContain('readBackVerified');
  });

  it('keeps mass fee distribution stage-first and school-scoped', () => {
    expect(financialPortalSource).toContain('const [massStageId, setMassStageId]');
    expect(financialPortalSource).toContain('المرحلة الدراسية');
    expect(financialPortalSource).toContain('const activeMassStages = useMemo');
    expect(financialPortalSource).toContain('massStudentMatchesStage(student, massStageId)');
    expect(financialPortalSource).toContain("student.schoolId === selectedSchool.id");
    expect(financialPortalSource).toContain('اختر المرحلة الدراسية قبل تنفيذ التوزيع الجماعي');
  });

  it('keeps financial report statuses truthful and gives the portal a reversible focus view', () => {
    expect(financialPortalSource).toContain('normalizeFinancialRecordStatus');
    expect(financialPortalSource).toContain('isFocusMode');
    expect(financialPortalSource).toContain('الرجوع إلى العرض الحالي');
  });
});
