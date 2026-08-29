import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('vendor payment integrity', () => {
  it('keeps payment unavailable until canonical treasury and ledger integration exists', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/procurement/VendorBillPaymentManager.tsx'),
      'utf8'
    );
    expect(source).toContain('الدفع محجوب بأمان');
    expect(source).toContain('لم تُسجل دفعة');
    expect(source).not.toContain('VendorPayment');
    expect(source).not.toContain('paymentNo:');
  });
});
