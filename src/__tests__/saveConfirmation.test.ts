import { describe, expect, it } from 'vitest';
import { isSaveActionLabel, withSaveSuccessMessage } from '../utils/saveConfirmation';

describe('global save confirmation', () => {
  it('recognizes persistence actions while excluding read-only and navigation controls', () => {
    expect(isSaveActionLabel('حفظ مركزي')).toBe(true);
    expect(isSaveActionLabel('تأكيد وفتح المدرسة مركزيًا')).toBe(true);
    expect(isSaveActionLabel('تحديث البيانات')).toBe(false);
    expect(isSaveActionLabel('تسجيل الدخول')).toBe(false);
    expect(isSaveActionLabel('نسخ الرابط')).toBe(false);
  });

  it('uses one explicit Arabic success prefix without duplicating it', () => {
    expect(withSaveSuccessMessage('تم إنشاء المدرسة')).toBe('تم الحفظ بنجاح — تم إنشاء المدرسة');
    expect(withSaveSuccessMessage('تم الحفظ بنجاح — تم تحديث المدرسة')).toBe('تم الحفظ بنجاح — تم تحديث المدرسة');
  });
});
