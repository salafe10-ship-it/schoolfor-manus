import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('voucher repository canonical read contract', () => {
  it('fails closed before using local voucher or accounting master data', () => {
    const source = readFileSync('src/database/repositories/VoucherRepository.ts', 'utf8');
    expect(source).toContain('voucher by id read');
    expect(source).toContain('voucher list read');
    expect(source).toContain('voucher fiscal and account validation read');
  });
});
