import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useStudentTransport authoritative state contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/student-affairs/hooks/useStudentTransport.ts'), 'utf8');

  it('starts without an assigned route or delivery period', () => {
    expect(source).toContain("useState<string>('')");
    expect(source).not.toContain('route_north');
    expect(source).not.toContain("useState<string>('both')");
  });
});
