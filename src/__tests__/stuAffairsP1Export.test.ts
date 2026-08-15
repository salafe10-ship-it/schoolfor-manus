import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { AuthorizationEngine } from '../authorization/AuthorizationEngine';
import { PERMISSIONS, permissionRegistry } from '../authorization/PermissionRegistry';
import { RoleResolver } from '../authorization/RoleResolver';
import { AuditRepository } from '../database/repositories/AuditRepository';
import { CanonicalStudentReadRepository } from '../database/repositories/CanonicalStudentReadRepository';
import { buildStudentExportXlsx, generateStudentExport, STUDENT_EXPORT_MAX_ROWS } from '../modules/student-export/application/StudentExportService';

const identity = { id: 'export-user', schoolId: 'school-1', branchId: 'branch-1', role: 'student_affairs', name: 'Export Operator' };
const context = { tenantId: 'school-1', schoolId: 'school-1', branchId: 'branch-1', academicYear: '2026', userId: 'export-user', role: 'student_affairs' };
const audit = { userId: 'export-user', userName: 'Export Operator', userRole: 'student_affairs', ipAddress: '127.0.0.1' };

describe('STU-AFFAIRS-P1-006-03 Student Export', () => {
  it('registers Student.Export as a distinct permission and does not grant it from Student.View alone', async () => {
    expect(permissionRegistry.isKnown(PERMISSIONS.STUDENT_EXPORT)).toBe(true);
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async () => [{ roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_READ } as any]);
    await resolver.ensureDatabasePermissions(identity);
    const engine = new AuthorizationEngine(resolver);
    expect(engine.can(identity, PERMISSIONS.STUDENT_READ)).toBe(true);
    expect(engine.can(identity, PERMISSIONS.STUDENT_EXPORT)).toBe(false);
  });

  it('allows Student.Export only when the trusted role assignment contains it', async () => {
    const resolver = new RoleResolver();
    resolver.configureDatabaseLoader(async () => [{ roleKey: 'student_affairs', permissionKey: PERMISSIONS.STUDENT_EXPORT }]);
    await resolver.ensureDatabasePermissions(identity);
    const engine = new AuthorizationEngine(resolver);
    expect(engine.can(identity, PERMISSIONS.STUDENT_EXPORT)).toBe(true);
  });

  it('generates a real XLSX workbook with operational fields only', () => {
    const buffer = buildStudentExportXlsx([{
      studentNumber: 'ST-001',
      name: '=Unsafe Formula',
      classroom: 'الرابع',
      section: '1',
      status: 'active',
      registrationDate: '2026-08-12',
      nationalId: 'MUST-NOT-EXPORT',
      parentPhone: 'MUST-NOT-EXPORT'
    }]);
    expect(buffer.subarray(0, 2).toString()).toBe('PK');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets.Students, { header: 1 });
    expect(rows[0]).toEqual(['رقم الطالب', 'اسم الطالب', 'الفصل', 'الشعبة', 'الحالة', 'تاريخ التسجيل']);
    expect(rows[1][1]).toBe("'=Unsafe Formula");
    expect(JSON.stringify(rows)).not.toContain('MUST-NOT-EXPORT');
  });

  it('rejects empty results and results above the 5,000-row cap without creating an artifact', async () => {
    const searchSpy = vi.spyOn(CanonicalStudentReadRepository, 'exportSearch');
    const auditSpy = vi.spyOn(AuditRepository, 'create').mockResolvedValue({} as any);
    searchSpy.mockResolvedValueOnce({ data: [], totalCount: 0 });
    await expect(generateStudentExport({}, context, audit, 'req-empty', 'corr-empty')).rejects.toThrow('لا توجد نتائج');
    searchSpy.mockResolvedValueOnce({ data: [], totalCount: STUDENT_EXPORT_MAX_ROWS + 1 });
    await expect(generateStudentExport({}, context, audit, 'req-limit', 'corr-limit')).rejects.toThrow('5000');
    expect(auditSpy).not.toHaveBeenCalled();
    searchSpy.mockRestore();
    auditSpy.mockRestore();
  });

  it('records accepted audit metadata before returning a generated artifact', async () => {
    const searchSpy = vi.spyOn(CanonicalStudentReadRepository, 'exportSearch').mockResolvedValue({
      data: [{ studentNumber: 'ST-001', name: 'Student', classroom: '1', section: 'A', status: 'active', registrationDate: '2026-08-12' }],
      totalCount: 1
    });
    const auditSpy = vi.spyOn(AuditRepository, 'create').mockResolvedValue({} as any);
    const result = await generateStudentExport({}, context, audit, 'req-1', 'corr-1');
    expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
    expect(result.rowCount).toBe(1);
    expect(auditSpy).toHaveBeenCalledWith('school-1', expect.objectContaining({ action: 'STUDENT_EXPORT_ACCEPTED', correlationId: 'corr-1' }));
    searchSpy.mockRestore();
    auditSpy.mockRestore();
  });
});
