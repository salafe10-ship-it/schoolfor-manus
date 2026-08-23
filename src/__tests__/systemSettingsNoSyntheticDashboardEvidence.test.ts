import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SystemSettingsPortal authoritative dashboard contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/SystemSettingsPortal.tsx'), 'utf8');

  it('does not claim fixed setting, isolation, backup, or latency evidence', () => {
    expect(source).toContain('لا يوجد سجل نسخة موثوق');
    expect(source).toContain('تتطلب فحص العزل المركزي');
    expect(source).not.toContain('Active (100%)');
    expect(source).not.toContain('اليوم، 02:00 صباحاً');
    expect(source).not.toContain('متصل • 1.2ms');
    expect(source).not.toContain('يعمل بانتظام');
    expect(source).not.toContain('متصل وفعال');
    expect(source).not.toContain('edupro-tenant-prime-001');
    expect(source).not.toContain('مؤسسة إدوبرو التعليمية الكبرى');
    expect(source).toContain("tenantId: ''");
  });
});
