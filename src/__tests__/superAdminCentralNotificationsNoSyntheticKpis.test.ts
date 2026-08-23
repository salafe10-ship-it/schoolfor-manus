import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminCentralNotifications.tsx'),
  'utf8',
);

describe('SuperAdminCentralNotifications evidence safety', () => {
  it('does not seed broadcast history or hardcode delivery claims', () => {
    expect(source).toContain("return saved ? JSON.parse(saved) : []");
    expect(source).toContain('غير متحقق');
    expect(source).not.toContain('99.95%');
    expect(source).not.toContain('84.2%');
    expect(source).not.toContain('4250');
    expect(source).not.toContain('4210');
  });

  it('fails closed when the central sender is unavailable', () => {
    expect(source).toContain('خدمة الإرسال المركزي غير متاحة');
    expect(source).not.toContain("status: 'completed'");
  });
});
