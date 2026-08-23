import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('student admission fee safety', () => {
  it('does not create synthetic uniform, transport, or registration charges', () => {
    const feeService = readFileSync(resolve(process.cwd(), 'src/database/services/StudentFeeService.ts'), 'utf8');
    const admission = readFileSync(resolve(process.cwd(), 'src/database/services/StudentAdmissionService.ts'), 'utf8');
    expect(feeService).toContain('totalFees: 0.00');
    expect(feeService).toContain("routeNumber: ''");
    expect(feeService).toContain('if (!Number.isFinite(amount) || amount <= 0) return;');
    expect(admission).toContain('registrationFeeAmount');
    expect(admission).toContain('feesRemaining: Number.isFinite(configuredRegistrationFee)');
    expect(admission).not.toContain('feesRemaining: 1500');
    expect(admission).not.toContain('studentData.birthDate || "2010-01-01"');
    expect(admission).not.toContain('studentData.address || "الرياض"');
    expect(admission).not.toContain('studentData.nationality || "سعودي"');
    expect(admission).not.toContain('studentData.religion || "مسلم"');
    expect(admission).toContain('اسم الطالب مطلوب ولا يمكن إنشاء سجل بدونه.');
    expect(admission).not.toContain('const name = studentData.name || "طالب جديد";');
  });
});
