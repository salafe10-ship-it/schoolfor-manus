import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SmartPortalGateway authoritative security status contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/SmartPortalGateway.tsx'), 'utf8');

  it('does not claim SSL is fully active without a verified probe', () => {
    expect(source).toContain('SSL غير متحقق');
    expect(source).not.toContain('100% SSL Active');
  });
});
