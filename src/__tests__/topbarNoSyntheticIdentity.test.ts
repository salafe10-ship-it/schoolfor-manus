import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('topbar identity integrity', () => {
  it('does not invent an employee, branch, or academic year', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Topbar.tsx'), 'utf8');
    expect(source).toContain("localStorage.getItem('active_employee_id') || ''");
    expect(source).toContain('الفرع غير محدد');
    expect(source).toContain('السنة غير محددة');
    expect(source).not.toContain("|| 'emp_11'");
    expect(source).not.toContain("|| '2026/2027'");
  });
});
