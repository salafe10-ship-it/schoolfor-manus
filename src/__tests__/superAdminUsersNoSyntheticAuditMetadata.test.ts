import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SuperAdminUsers authoritative audit metadata contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminUsers.tsx'), 'utf8');

  it('does not fabricate login, device, IP, or timestamp metadata', () => {
    expect(source).toContain('غير متاح من الدليل الحالي');
    expect(source).not.toContain('Math.floor(10 + Math.random() * 80)');
    expect(source).not.toContain('192.168.12.');
    expect(source).not.toContain('2026-06-26 14:12');
    expect(source).not.toContain('Chrome (macOS)');
  });
});
