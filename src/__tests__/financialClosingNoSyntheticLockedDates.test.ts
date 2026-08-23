import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FinancialClosingDashboard authoritative period contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/FinancialClosingDashboard.tsx'), 'utf8');

  it('does not seed locked accounting dates', () => {
    expect(source).toContain('setLockedDates([]);');
    expect(source).not.toContain("['2026-07-15', '2026-07-16', '2026-07-17']");
    expect(source).not.toContain('Seed some locked days for demo realism');
  });
});
