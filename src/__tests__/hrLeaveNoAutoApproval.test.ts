import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('HR leave approval integrity', () => {
  it('does not approve leave requests automatically', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    expect(source).toContain("status: 'pending'");
    expect(source).not.toContain("status: 'approved' // Auto approve for demonstration");
  });
});
