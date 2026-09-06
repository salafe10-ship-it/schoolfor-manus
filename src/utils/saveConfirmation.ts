export const SAVE_SUCCESS_PREFIX = 'تم الحفظ بنجاح';

const SAVE_ACTION_PATTERN = /(حفظ|تأسيس|إنشاء|اعتماد|ترحيل|تسجيل|إضافة|تعديل|تحديث|إقفال|رسملة|تأكيد.*(?:فتح|حفظ|إنشاء))/i;
const NON_SAVE_ACTION_PATTERN = /(تسجيل الدخول|تسجيل الخروج|تحديث البيانات|تحديث الدليل|تحديث الحوادث|تحديث.*المنصة|نسخ|فتح لوحة|فتح صفحة|إرسال|تصدير|طباعة|تحميل)/i;

/** Detect a user intent to persist data from the visible control label. */
export function isSaveActionLabel(label: string): boolean {
  const normalized = String(label || '').replace(/\s+/g, ' ').trim();
  return Boolean(normalized && SAVE_ACTION_PATTERN.test(normalized) && !NON_SAVE_ACTION_PATTERN.test(normalized));
}

export function withSaveSuccessMessage(message: string): string {
  const normalized = String(message || '').trim();
  if (!normalized) return SAVE_SUCCESS_PREFIX;
  return normalized.includes(SAVE_SUCCESS_PREFIX) ? normalized : `${SAVE_SUCCESS_PREFIX} — ${normalized}`;
}
