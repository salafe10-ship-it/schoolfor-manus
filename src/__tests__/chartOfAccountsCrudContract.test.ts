import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');

describe('chart of accounts CRUD contract', () => {
  const saveStart = source.indexOf('const handleSaveCoa = async');
  const saveEnd = source.indexOf('const accountingContextValue', saveStart);
  const saveHandler = source.slice(saveStart, saveEnd);

  it('prevents duplicate codes and invalid parent relationships', () => {
    expect(saveHandler).toContain('كود الحساب موجود مسبقاً ولا يمكن تكراره');
    expect(saveHandler).toContain('لا يمكن جعل الحساب أباً لنفسه');
    expect(saveHandler).toContain('الحساب الأب غير موجود أو غير نشط');
  });

  it('protects posted journal references from account-code mutation', () => {
    expect(saveHandler).toContain('hasPostedReference');
    expect(saveHandler).toContain('لا يمكن تغيير كود حساب مستخدم في قيد مرحل');
  });

  it('persists through the canonical financial adapter', () => {
    expect(saveHandler).toContain('persistCanonicalFinancialSnapshot({ chartOfAccounts: updatedAccounts })');
    expect(saveHandler).not.toContain('localStorage.setItem');
  });
});
