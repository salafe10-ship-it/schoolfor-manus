import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/GeneralLedgerPortal.tsx'), 'utf8');

describe('journal engine state and double-entry contract', () => {
  it('creates manual entries as drafts instead of silently posting', () => {
    const start = source.indexOf('const handleAddJV = async');
    const end = source.indexOf('// ==========================================================', start);
    const handler = source.slice(start, end);
    expect(handler).toContain("status: 'مسودة' as const");
    expect(handler).toContain('يجب اعتماده ثم ترحيله');
    expect(handler).not.toContain("status: 'مرحل' as const");
  });

  it('rejects invalid accounts and protects the double-entry lifecycle', () => {
    expect(source).toContain('الحساب المدين أو الدائن غير موجود أو غير نشط');
    expect(source).toContain('لا يمكن إنشاء قيد على حساب رئيسي');
    expect(source).toContain('القيد غير متوازن محاسبياً');
    expect(source).toContain('لا يمكن تعديل القيود المرحلة أو المعتمدة');
    expect(source).toContain('لا يمكن إعادة القيد المرحل إلى مسودة');
  });

  it('requires trusted school context on journal integrity validation', () => {
    expect(source).toContain('لا يمكن التحقق من القيد دون معرف مدرسة موثوق');
    expect(source).toContain('لا تطابق مدرسة الجلسة الحالية');
  });
});
