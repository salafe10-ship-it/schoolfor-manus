import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SuperAdminDomains authoritative health contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminDomains.tsx'), 'utf8');

  it('does not simulate DNS health or latency', () => {
    expect(source).toContain("status: 'unknown', latency: null, time: null");
    expect(source).toContain('لا يوجد موصل DNS/HTTP مركزي موثوق');
    expect(source).toContain('غير متحقق');
    expect(source).toContain('DNS/SSL غير متحقق');
    expect(source).not.toContain('SSL موثوق وآمن');
    expect(source).not.toContain('Math.random() > 0.05');
    expect(source).not.toContain('15 + Math.random() * 45');
  });
});
