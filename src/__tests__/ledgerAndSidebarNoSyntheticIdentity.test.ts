import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('ledger and sidebar identity evidence safety', () => {
  it('does not select or seed a local employee identity', () => {
    const ledger = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');
    const sidebar = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Sidebar.tsx'), 'utf8');
    expect(ledger).toContain('return saved ? JSON.parse(saved) : []');
    expect(ledger).not.toContain("id: 'audit_0'");
    expect(sidebar).toContain("localStorage.getItem('active_employee_id') || ''");
    expect(sidebar).not.toContain("|| 'emp_11'");
  });
});
