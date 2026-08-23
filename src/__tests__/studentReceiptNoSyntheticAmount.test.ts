import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student receipt integrity', () => {
  it('does not invent a payment amount when the student has no balance', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
      'utf8'
    );
    expect(source).toContain('amount: remainingBalance > 0 ? remainingBalance : 0');
    expect(source).not.toContain('remainingBalance > 0 ? remainingBalance : 1000');
  });
});
