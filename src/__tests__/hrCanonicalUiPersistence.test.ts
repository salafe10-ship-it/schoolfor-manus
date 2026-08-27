import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const portal = readFileSync(resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'), 'utf8');
const employees = readFileSync(resolve(process.cwd(), 'src/components/hr/EmployeesTab.tsx'), 'utf8');
const attendance = readFileSync(resolve(process.cwd(), 'src/components/hr/AttendanceTab.tsx'), 'utf8');
const otherTabs = readFileSync(resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');

describe('HR canonical UI persistence contract', () => {
  it('loads and saves the shared HR snapshot rather than local browser data', () => {
    expect(portal).toContain("fetch('/api/hr/database'");
    expect(portal).toContain("method: 'POST'");
    expect(portal).toContain('expectedVersion: canonicalVersionRef.current');
    expect(portal).toContain("countryCode: 'ZZ'");
    expect(portal).toContain('canonicalBaselineRef.current = serialized');
  });

  it('allows operational record updates but keeps fake document uploads blocked', () => {
    expect(employees).not.toContain('حفظ ملف الموظف متوقف');
    expect(attendance).not.toContain('تعديل الحضور متوقف');
    expect(otherTabs).not.toContain('حفظ الأقسام متوقف');
    expect(employees).toContain('لن يُنشأ مرفق صوري');
  });
});
