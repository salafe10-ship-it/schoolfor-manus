import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/ModernSchoolDashboard.tsx'), 'utf8');
const topbarSource = readFileSync(resolve(process.cwd(), 'src/components/Topbar.tsx'), 'utf8');
const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const ledgerSource = readFileSync(resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');

describe('Main School Dashboard contract', () => {
  it('does not present legacy or hardcoded operational values as live metrics', () => {
    expect(source).not.toContain('EduPro Enterprise');
    expect(source).not.toContain('620,000');
    expect(source).not.toContain('850,000');
    expect(source).not.toContain('5,850,000');
    expect(source).not.toContain('4,250,000');
    expect(source).not.toContain('96%');
    expect(source).not.toContain('87%');
    expect(source).not.toContain('خالد محمد');
    expect(source).not.toContain('أحمد السالم');
  });

  it('uses explicit empty-state semantics where no live query is wired', () => {
    expect(source).toContain('جار التحقق من المصدر الحي');
    expect(source).toContain('لا يوجد مصدر مالي حي');
    expect(source).toContain('مصدر Audit حي مطلوب');
  });

  it('routes academic and timetable shortcuts to the academic screen', () => {
    expect(source).toContain("{ section: 'academic', label: 'الأكاديمية'");
    expect(source).toContain("{ section: 'academic', label: 'الجداول الدراسية'");
  });

  it('does not expose duplicate reports or standalone treasury shortcuts on the main dashboard', () => {
    expect(source).not.toContain("{ section: 'financial_reports'");
    expect(source).not.toContain("{ section: 'treasury'");
  });

  it('keeps reports in accounting and nests treasury and banking there', () => {
    expect(ledgerSource).toContain("const TreasuryPlatformPortal = React.lazy(() => import('./TreasuryPlatformPortal'));");
    expect(ledgerSource).toContain('الخزينة والبنوك — ضمن الحسابات');
    expect(ledgerSource).toContain("{ id: 'treasury', label: 'إدارة الخزينة والحسابات البنكية'");
    expect(ledgerSource).toContain("{activeTab === 'treasury'");
    expect(ledgerSource).toContain("{activeTab === 'financial_reports'");
    expect(appSource).not.toContain("const TreasuryPlatformPortal = React.lazy(() => import('./components/TreasuryPlatformPortal'));");
  });

  it('renders interactive controls as semantic buttons with accessible labels', () => {
    expect(source).toContain('type=\"button\"');
    expect(source).toContain('aria-label=\"البحث في شؤون الطلاب\"');
    expect(source).toContain('focus:ring-2');
  });

  it('keeps the visible Topbar identity and scope displays trusted', () => {
    expect(topbarSource).toContain('SchoolForManus • إدارة المدارس');
    expect(topbarSource).toContain('id=\"trusted-branch-display\"');
    expect(topbarSource).toContain('id=\"trusted-academic-year-display\"');
    expect(appSource).toContain('userName={trustedSessionUser?.name || \'مستخدم المدرسة\'}');
  });
});
