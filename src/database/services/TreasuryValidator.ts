import { TreasuryAccount, TreasuryTransaction, PaymentInstrumentType, TreasuryAccountType } from '../../types';

export class TreasuryValidator {
  
  public static validateAccountInput(schoolId: string, input: Partial<TreasuryAccount>): void {
    if (!schoolId) {
      throw new Error('التحقق من البيانات: معرف المدرسة/المؤسسة مطلوب.');
    }
    if (!input.name || input.name.trim() === '') {
      throw new Error('التحقق من البيانات: اسم حساب الخزينة/البنك مطلوب ولا يمكن أن يكون فارغاً.');
    }
    if (!input.code || input.code.trim() === '') {
      throw new Error('التحقق من البيانات: الرمز التعريفي الفريد مطلوب.');
    }
    if (!input.type) {
      throw new Error('التحقق من البيانات: نوع حساب الخزينة مطلوب.');
    }
    const allowedTypes: TreasuryAccountType[] = ['Main Chest', 'Branch Chest', 'Bank Account', 'Virtual Chest'];
    if (!allowedTypes.includes(input.type)) {
      throw new Error(`التحقق من البيانات: نوع الحساب غير صالح. الأنواع المتاحة: ${allowedTypes.join(', ')}`);
    }
    if (!input.glAccountId || input.glAccountId.trim() === '') {
      throw new Error('التحقق من البيانات: ربط حساب دفتر الأستاذ العام (GL Account ID) مطلوب.');
    }
    if (!input.currency || input.currency.trim() === '') {
      throw new Error('التحقق من البيانات: العملة الرسمية للحساب مطلوبة.');
    }
  }

  public static validateTransactionInput(
    schoolId: string,
    input: {
      type: 'Deposit' | 'Withdrawal' | 'Transfer';
      sourceAccountId?: string;
      destinationAccountId?: string;
      amount: number;
      currency: string;
      exchangeRate?: number;
      paymentInstrument: PaymentInstrumentType;
      description: string;
    }
  ): void {
    if (!schoolId) {
      throw new Error('التحقق من البيانات: معرف المدرسة/المؤسسة مطلوب للحركة.');
    }
    if (!input.type) {
      throw new Error('التحقق من البيانات: نوع حركة الخزينة مطلوب (إيداع، سحب، تحويل).');
    }
    if (input.amount <= 0) {
      throw new Error('التحقق من البيانات: يجب أن يكون مبلغ الحركة أكبر من صفر.');
    }
    if (!input.currency || input.currency.trim() === '') {
      throw new Error('التحقق من البيانات: عملة الحركة مطلوبة.');
    }
    if (input.exchangeRate !== undefined && input.exchangeRate <= 0) {
      throw new Error('التحقق من البيانات: يجب أن يكون سعر الصرف أكبر من صفر.');
    }
    if (!input.paymentInstrument) {
      throw new Error('التحقق من البيانات: وسيلة الدفع/الأداة المالية المستخدمة مطلوبة.');
    }
    if (!input.description || input.description.trim() === '') {
      throw new Error('التحقق من البيانات: الوصف التفصيلي للحركة المالية مطلوب لأغراض التدقيق.');
    }

    // Contextual checks
    if (input.type === 'Deposit') {
      if (!input.destinationAccountId) {
        throw new Error('التحقق من البيانات: حساب الخزينة المستهدف بالإيداع مطلوب.');
      }
    } else if (input.type === 'Withdrawal') {
      if (!input.sourceAccountId) {
        throw new Error('التحقق من البيانات: حساب الخزينة المصدر للسحب مطلوب.');
      }
    } else if (input.type === 'Transfer') {
      if (!input.sourceAccountId || !input.destinationAccountId) {
        throw new Error('التحقق من البيانات: حسابهما المصدر والهدف مطلوبان لعمليات التحويل البيني.');
      }
      if (input.sourceAccountId === input.destinationAccountId) {
        throw new Error('التحقق من البيانات: لا يمكن التحويل لنفس الحساب المصدر.');
      }
    }
  }
}
