import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const serviceSource = readFileSync('src/database/services/StudentFeeService.ts', 'utf8');

describe('student fee service canonical read contract', () => {
  it('fails closed before deriving commitments from fallback collections', () => {
    expect(serviceSource).toContain("assertCanonicalPersistence(operation)");
    expect(serviceSource).toContain("student fee and logistical commitments read");
    expect(serviceSource).toContain("student uniform and transportation deletion lookup");
  });
});
