import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/StudentFinancialPortal.tsx'),
  'utf8',
);

describe('financial write lock is visible and enforced in the student finance UI', () => {
  it('keeps the canonical financial mutation lock enabled', () => {
    expect(source).toContain("const financialWritesLocked = financialWriteMode === 'snapshot_read_only';");
    expect(source).toContain("const [financialWriteMode, setFinancialWriteMode] = useState<FinancialWriteMode>('snapshot_read_only');");
    expect(source).toContain('المصدر المالي متصل للقراءة فقط — الحفظ والترحيل مقفلان');
  });

  it('guards the receipt posting action with the same lock', () => {
    const posting = source.slice(source.indexOf('onClick={handlePostStudRv}'));
    expect(posting).toContain('disabled={financialWritesLocked || financialPersistence !== \'ready\'');
  });

  it('keeps nested fee mutations disabled in read-only mode', () => {
    expect(source).toContain("const financialMutationDisabled = financialWritesLocked || financialPersistence !== 'ready';");
    expect(source).toContain('disabled={financialMutationDisabled}');
    expect(source).toContain('disabled={financialMutationDisabled || !currFeeId}');
    expect(source).toContain('الحفظ والترحيل والإلغاء والحذف مقفلة');
  });

  it('does not label the isolated empty test snapshot as a verified database refresh', () => {
    const initialLoad = source.slice(source.indexOf('const loadFinancialDb = async () =>'), source.indexOf('loadFinancialDb();'));
    const refresh = source.slice(source.indexOf('const handleRefreshData = async () =>'), source.indexOf('// Mass assign fees'));

    expect(initialLoad.indexOf("res.meta?.source === 'local_isolated_test'")).toBeGreaterThanOrEqual(0);
    expect(refresh.indexOf("res.meta?.source === 'local_isolated_test'")).toBeGreaterThanOrEqual(0);
    expect(refresh.indexOf("res.meta?.source === 'local_isolated_test'")).toBeLessThan(
      refresh.indexOf('تم تحديث البيانات المالية من المصدر المعتمد'),
    );
    expect(source).toContain('لقطة الاختبار محلية وفارغة؛ لم يتم الاتصال بقاعدة البيانات. الحفظ والترحيل مقفلان.');
  });
});
