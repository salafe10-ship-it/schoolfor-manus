import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('inventory portal action guards', () => {
  it('handles blocked create/update/delete actions without uncaught exceptions', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/inventory/InventoryManagementPortal.tsx'), 'utf8');
    expect(source).toContain('المخزون متوقف؛ تعذر حفظ الصنف:');
    expect(source).toContain('المخزون متوقف؛ تعذر تعديل الصنف:');
    expect(source).toContain('المخزون متوقف؛ تعذر حذف الصنف:');
    expect(source).toContain('catch (err: any)');
  });
});
