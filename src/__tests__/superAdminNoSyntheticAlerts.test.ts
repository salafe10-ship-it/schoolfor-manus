import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin alert integrity', () => {
  it('does not invent incidents when the central alert feed is absent', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminDashboard.tsx'), 'utf8');
    expect(source).toContain('const alerts = propAlerts || [];');
    expect(source).toContain('لا توجد بيانات حوادث موثقة');
    expect(source).not.toContain('فشل ترخيص مدارس النور النموذجية');
    expect(source).not.toContain('تذبذب طفيف في استجابة بوابة Supabase API');
  });
});
