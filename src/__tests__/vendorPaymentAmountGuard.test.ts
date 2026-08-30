import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('vendor payment integrity', () => {
  it('routes invoice approval to AP while keeping cash disbursement in treasury', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/procurement/VendorBillPaymentManager.tsx'),
      'utf8'
    );
    expect(source).toContain('onApproveBill');
    expect(source).toContain('مطابقة واعتماد وترحيل');
    expect(source).toContain('إحالة إلى الخزينة');
    expect(source).not.toContain('الدفع محجوب');
    expect(source).not.toContain('لم تُسجل دفعة');
    expect(source).not.toContain('VendorPayment');
    expect(source).not.toContain('paymentNo:');
  });
});
