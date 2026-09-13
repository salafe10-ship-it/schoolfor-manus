import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('HR form canonical persistence', () => {
  it('routes form state through the parent canonical snapshot writer', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    const portal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
    expect(file).not.toContain('localStorage');
    expect(portal).toContain("method: 'POST'");
    expect(portal).toContain('expectedVersion: canonicalVersionRef.current');
    expect(file).toContain("status: 'pending'");
  });

  it('does not expose HR mutations without the trusted write capability', () => {
    const employees = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/EmployeesTab.tsx'), 'utf8');
    const attendance = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/AttendanceTab.tsx'), 'utf8');
    const otherTabs = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    const portal = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
    const payroll = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/PayrollTab.tsx'), 'utf8');
    expect(employees).toContain('canManage?: boolean');
    expect(employees).toContain("if (!canManage) {");
    expect(attendance).toContain('canManage?: boolean');
    expect(attendance).toContain("حسابك للعرض فقط؛ لا تملك صلاحية تعديل الحضور والانصراف.");
    expect(otherTabs).toContain('const requireWrite = () =>');
    expect(otherTabs).toContain('disabled={!canManage}');
    expect(portal).toContain('canManage={canUseTrustedPermission(PERMISSIONS.HR_WRITE)}');
    expect(portal).toContain('canonicalSaveError');
    expect(payroll).toContain('canFinancialWrite?: boolean');
    expect(payroll).toContain('disabled={isApproved ? !canFinancialWrite : !canApprove}');
    expect(employees).toContain('البريد الإلكتروني المهني <span className="text-slate-500 font-normal">(اختياري)</span>');
    expect(employees).not.toContain('البريد الإلكتروني المهني <span className="text-rose-500">*</span>');
  });
});
