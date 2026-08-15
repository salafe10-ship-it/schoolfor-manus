import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const serverSource = fs.readFileSync('server.ts', 'utf8');
const portalSource = fs.readFileSync('src/components/StudentAffairsPortal.tsx', 'utf8');
const route = serverSource.slice(serverSource.indexOf('app.get("/api/students/export"'), serverSource.indexOf('// Students Database API'));

describe('STU-AFFAIRS-P1-006-03 export route contract', () => {
  it('uses authentication, dedicated authorization, trusted tenant resolution, and server XLSX generation', () => {
    expect(route).toContain('authenticateRequest');
    expect(route).toContain('requirePermission(PERMISSIONS.STUDENT_EXPORT)');
    expect(route).toContain('resolveStudentTenantContext(req)');
    expect(route).toContain('generateStudentExport');
    expect(route).toContain('STUDENT_EXPORT_CONTENT_TYPE');
  });

  it('does not use a client school selector or false success path', () => {
    expect(route).not.toContain('req.query.schoolId');
    expect(route).not.toContain('filteredStudents');
    expect(route).toContain("'SUCCESSFUL'");
    expect(route).toContain("'REJECTED'");
    expect(route).toContain("'FAILED'");
  });

  it('uses the server export repository path and does not create a page-only CSV in the browser', () => {
    expect(portalSource).toContain('StudentRepository.exportStudents');
    expect(portalSource).toContain('تصدير XLSX');
    expect(portalSource).not.toContain('data:text/csv');
    expect(portalSource).not.toContain('تم تصدير ملف Excel');
  });
});
