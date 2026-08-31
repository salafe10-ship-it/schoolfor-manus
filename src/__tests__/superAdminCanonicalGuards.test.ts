import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin canonical guards', () => {
  it('keeps module mutations in the dedicated screen and routes subscription changes centrally', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminOperationsCenter.tsx'), 'utf8');
    expect(file).toContain('إدارة وحدات المدرسة أصبحت متاحة من شاشة الميزات المركزية');
    expect(file).toContain('const updateCentralSchool = async');
    expect(file).toContain("operation: 'update'");
    expect(file).toContain("authenticatedRequest(`/api/admin/central/schools/");
    expect(file).not.toContain('erp_tenant_modules_v1');
    expect(file).not.toContain('localStorage');
  });
});
