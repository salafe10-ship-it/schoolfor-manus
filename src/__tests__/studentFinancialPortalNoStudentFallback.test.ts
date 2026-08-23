import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student financial source isolation', () => {
  it('does not derive financial balances from general student rows', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'), 'utf8');
    expect(source).toContain('const [financialInvoices, setFinancialInvoices] = useState<Invoice[]>([]);');
    expect(source).toContain('if (financialInvoices.length === 0) return [];');
    expect(source).not.toContain('if (financialInvoices.length === 0) return filteredStudents;');
    expect(source).toContain(': 0;\n    const totalPaid = financialInvoices.length > 0');
  });
});
