import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SystemErrorLogsTab authoritative log contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/system-health/SystemErrorLogsTab.tsx'), 'utf8');

  it('does not generate or persist simulated stack traces', () => {
    expect(source).toContain('لا تُضاف أخطاء اصطناعية');
    expect(source).not.toContain('Math.floor(100 + Math.random() * 800)');
    expect(source).not.toContain('EnterpriseErrorLogger.log({');
    expect(source).toContain('وضع الاختبار غير متاح');
  });
});
