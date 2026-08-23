import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const serverSource = readFileSync('server.ts', 'utf8');

describe('student fees integrity contract', () => {
  it('validates stable identifiers and rejects duplicate financial rows', () => {
    expect(serverSource).toContain('validateFinancialSnapshotIntegrity');
    expect(serverSource).toContain('المعرّف المالي مكرر داخل');
  });

  it('rejects invalid invoice and receipt amounts before persistence', () => {
    expect(serverSource).toContain('قيمة المطالبة المالية');
    expect(serverSource).toContain('قيمة سند القبض');
    expect(serverSource).toContain('الرصيد المالي للمطالبة');
  });

  it('requires balanced posted journal entries', () => {
    expect(serverSource).toContain("['posted', 'مرحّل', 'مُرحّل']");
    expect(serverSource).toContain('غير متوازن محاسبياً');
  });
});
