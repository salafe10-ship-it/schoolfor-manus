import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student financial source isolation', () => {
  it('does not derive financial balances from general student rows', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'), 'utf8');
    expect(source).toContain('const [financialInvoices, setFinancialInvoices] = useState<Invoice[]>([]);');
    expect(source).toContain('aggregateStudentFinancialSnapshot(financialInvoices)');
    expect(source).toContain('return financialSnapshot.students.map(balance => {');
    expect(source).not.toContain('return filteredStudents;');
    expect(source).toContain("if (financialPersistence !== 'ready')");
    expect(source).toContain('totalDebts: null');
    expect(source).toContain('financial-sidebar-edit-state-blocked');
    expect(source).toContain('قراءة فقط — الحفظ متوقف');
  });
});
