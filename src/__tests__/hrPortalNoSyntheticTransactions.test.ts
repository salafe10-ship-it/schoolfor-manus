import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('legacy HR portal integrity', () => {
  it('does not seed attendance or financial HR actions as real records', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/hr/HumanResourcesPortal.tsx'),
      'utf8'
    );
    expect(source).toContain('attendanceList = [];');
    expect(source).toContain('leavesList = [];');
    expect(source).toContain('advancesList = [];');
    expect(source).not.toContain("status: 'approved' }");
    expect(source).not.toContain("status: 'applied' }");
  });
});
