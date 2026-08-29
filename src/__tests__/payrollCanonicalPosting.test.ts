import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/hr/PayrollTab.tsx', 'utf8');

describe('payroll canonical posting contract', () => {
  it('does not post payroll through browser storage in canonical mode', () => {
    expect(source).not.toContain('localStorage');
    expect(source).toContain('onApprovePayroll');
    expect(source).toContain('onPayPayroll');
  });

  it('does not approve employee advances through browser storage in canonical mode', () => {
    const otherHr = readFileSync('src/components/hr/OtherHRTabs.tsx', 'utf8');
    expect(otherHr).not.toContain('localStorage');
    expect(otherHr).toContain("status: 'pending'");
  });

  it('does not read local posted-state in canonical mode', () => {
    expect(source).toContain('persistedRun?.status === \'paid\'');
  });
});
