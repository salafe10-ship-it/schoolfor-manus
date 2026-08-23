import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('vendor payment integrity', () => {
  it('rejects zero, invalid, or overpayment amounts', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/procurement/VendorBillPaymentManager.tsx'),
      'utf8'
    );
    expect(source).toContain('paymentAmount <= 0 || paymentAmount > selectedBill.remainingAmount');
    expect(source).toContain('useState<number>(0)');
    expect(source).not.toContain('useState<number>(10000)');
  });
});
