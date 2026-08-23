import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SystemAuditTrailTab authoritative event contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/system-health/SystemAuditTrailTab.tsx'), 'utf8');

  it('does not persist manually simulated audit events', () => {
    expect(source).toContain('لا تُضاف أحداث محاكاة');
    expect(source).toContain('وضع المحاكاة غير متاح');
    expect(source).not.toContain('EnterpriseAuditLogger.log({');
  });
});
