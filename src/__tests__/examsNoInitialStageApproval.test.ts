import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('exam stage approval integrity', () => {
  it('starts all stages open until an actual approval action', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'),
      'utf8'
    );
    expect(source).toContain("'primary': { approved: false, approvedBy: '', approvedAt: '' }");
    expect(source).not.toContain("approvedBy: 'أ. فاطمة الغامدي', approvedAt: '٢٠٢٦/٠٦/٢٥ ١٠:٠٠ ص'");
  });
});
