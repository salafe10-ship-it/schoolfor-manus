import { Invoice } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { CurrencyRepository } from '../repositories/CurrencyRepository';
import { FeeStructureEngine } from './FeeStructureEngine';
import { FeeEligibilityEngine } from './FeeEligibilityEngine';
import { InvoicePolicyService } from './InvoicePolicyService';
import { EnterpriseLogger } from './EnterpriseLogger';

export class InvoiceValidationError extends Error {
  public errors: Record<string, string>;
  constructor(message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'InvoiceValidationError';
    this.errors = errors;
  }
}

/**
 * Enterprise Invoice Validator
 * Strictly validates all invoice structures, state transitions, and business rules.
 */
export class InvoiceValidator {
  /**
   * Performs deep business validation on the complete Invoice object before any DB write.
   */
  public static async validate(invoice: Partial<Invoice>, isNew: boolean = true): Promise<void> {
    if (!invoice) {
      throw new InvoiceValidationError("بيانات الفاتورة مطلوبة ولا يمكن أن تكون فارغة.");
    }

    const errors: Record<string, string> = {};

    // 1. Validate requestor / student exists (طالب غير موجود)
    if (!invoice.studentId || invoice.studentId.trim() === '') {
      errors.studentId = "معرف الطالب مطلوب كطالب أو مستفيد من الفاتورة.";
    } else {
      const students = FallbackStorage.getStudents();
      const student = students.find(s => s.id === invoice.studentId);
      if (!student) {
        errors.studentId = "مخالفة: الطالب المحدد غير موجود في سجلات المؤسسة.";
      } else if (student.status === 'inactive' || student.status === 'suspended') {
        errors.studentId = "مخالفة: لا يمكن إصدار أو تعديل فاتورة لطالب غير نشط أو موقوف.";
      }
    }

    // 2. Validate academic year and fiscal year (سنة دراسية مغلقة / سنة مالية مغلقة)
    if (!invoice.academicYearId || invoice.academicYearId.trim() === '') {
      errors.academicYearId = "السنة الدراسية مطلوبة لإصدار الفاتورة وتتبع الإيرادات.";
    } else {
      const calendars = FallbackStorage.getAcademicCalendars();
      const calendar = calendars.find(c => c.id === invoice.academicYearId);
      if (!calendar) {
        errors.academicYearId = "مخالفة: السنة الدراسية المحددة غير موجودة.";
      } else if (!calendar.isActive) {
        errors.academicYearId = "مخالفة: السنة الدراسية المحددة مغلقة ولا يمكن إصدار فواتير فيها.";
      }
    }

    if (!invoice.fiscalYearId || invoice.fiscalYearId.trim() === '') {
      errors.fiscalYearId = "السنة المالية مطلوبة للامتثال المحاسبي والتقارير الدورية.";
    } else {
      const fYears = FallbackStorage.getFiscalYears();
      const fYear = fYears.find(f => f.id === invoice.fiscalYearId || f.yearName === invoice.fiscalYearId);
      if (!fYear) {
        errors.fiscalYearId = "مخالفة: السنة المالية المحددة غير موجودة.";
      } else if (fYear.status === 'closed') {
        errors.fiscalYearId = "مخالفة: السنة المالية المحددة مغلقة ولا يمكن إصدار فواتير فيها.";
      }
    }

    // 3. Validate items / lines / fees (No empty invoices, non-negative numbers)
    const hasLines = invoice.lines && invoice.lines.length > 0;
    const hasItems = invoice.items && invoice.items.length > 0;
    if (!hasLines && !hasItems) {
      errors.lines = "مخالفة: يجب أن تحتوي الفاتورة على بند رسوم (Invoice Line) واحد على الأقل.";
    }

    // Validate non-negative values
    const totalAmount = invoice.totalAmount ?? invoice.amount ?? 0;
    if (totalAmount < 0) {
      errors.totalAmount = "مخالفة: القيمة الإجمالية للفاتورة لا يمكن أن تكون سالبة.";
    }

    // Validate each line/item has positive quantities and prices
    if (invoice.lines) {
      invoice.lines.forEach((line, index) => {
        if (line.quantity <= 0) {
          errors[`line_${index}_quantity`] = `الكمية للبند ${index + 1} يجب أن تكون أكبر من الصفر.`;
        }
        if (line.unitPrice < 0) {
          errors[`line_${index}_unitPrice`] = `سعر الوحدة للبند ${index + 1} لا يمكن أن يكون سالباً.`;
        }
        if (line.amount < 0) {
          errors[`line_${index}_amount`] = `مبلغ البند ${index + 1} لا يمكن أن يكون سالباً.`;
        }
      });
    }

    if (invoice.items) {
      invoice.items.forEach((item, index) => {
        if (item.amount < 0) {
          errors[`item_${index}_amount`] = `قيمة البند ${index + 1} لا يمكن أن تكون سالبة.`;
        }
      });
    }

    // 4. Validate fees (رسوم غير موجودة، غير مؤهلة، منتهية)
    if (invoice.lines && invoice.lines.length > 0) {
      const schoolId = invoice.schoolId || 'school_1';
      let templates: any[] = [];
      try {
        templates = await FeeStructureEngine.getTemplates(schoolId);
      } catch (e: any) {
        EnterpriseLogger.warn('Could not load templates during validation, using fallback:', 'InvoiceValidator', { error: e?.message || e });
      }

      const students = FallbackStorage.getStudents();
      const student = students.find(s => s.id === invoice.studentId);

      for (let index = 0; index < invoice.lines.length; index++) {
        const line = invoice.lines[index];

        // Search for fee template by name or description
        const template = templates.find(t => 
          t.name.trim() === line.description.trim() || 
          line.description.trim().includes(t.name.trim())
        );

        if (!template) {
          // If no matching template is found, flag as fee not found
          errors[`line_${index}_fee`] = `مخالفة: الرسم المالي المذكور (${line.description}) غير موجود في شجرة الرسوم المعتمدة للمدرسة.`;
        } else {
          // Check if expired
          if (template.effectiveTo) {
            const expiryDate = new Date(template.effectiveTo);
            const now = new Date();
            if (now > expiryDate) {
              errors[`line_${index}_expired`] = `مخالفة: الرسم المالي (${template.name}) منتهي الصلاحية بتاريخ ${template.effectiveTo}.`;
            }
          }

          // Check eligibility
          if (student) {
            const eligibility = FeeEligibilityEngine.evaluate(student, template);
            if (eligibility.status === 'Not Eligible') {
              errors[`line_${index}_eligibility`] = `مخالفة: الطالب غير مؤهل لهذا الرسم (${template.name}). السبب: ${eligibility.description}`;
            }
          }
        }
      }
    }

    // 5. Validate currency (عملة غير صالحة)
    if (invoice.currency) {
      const master = CurrencyRepository.getCurrencyByCode(invoice.currency);
      if (!master || master.status !== 'active') {
        errors.currency = `مخالفة: العملة المحددة (${invoice.currency}) غير صالحة أو غير نشطة في النظام.`;
      }
    }

    // 6. Validate invoice balance (Invoice غير متزنة)
    const calculated = InvoicePolicyService.calculateTotals(invoice);
    const providedTotal = invoice.totalAmount ?? invoice.amount ?? 0;
    if (Math.abs(providedTotal - calculated.totalAmount) > 0.01) {
      errors.balance = `مخالفة: الفاتورة غير متزنة. المبلغ الإجمالي المقدم (${providedTotal}) لا يتطابق مع المجموع الفعلي المحتسب من البنود والضرائب والخصومات (${calculated.totalAmount}).`;
    }

    if (Object.keys(errors).length > 0) {
      throw new InvoiceValidationError("فشل التحقق من صحة قواعد العمل للفاتورة.", errors);
    }
  }

  /**
   * Validates state transition strictly inside the lifecycle.
   */
  public static validateStateTransition(fromStatus: string, toStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'Draft': ['Pending Approval', 'Cancelled'],
      'Pending Approval': ['Approved', 'Draft', 'Cancelled'],
      'Approved': ['Issued', 'Cancelled'],
      'Issued': ['Sent', 'Partially Paid', 'Paid', 'Overdue', 'Disputed', 'Cancelled', 'Void', 'Credit Issued'],
      'Sent': ['Partially Paid', 'Paid', 'Overdue', 'Disputed', 'Cancelled', 'Void', 'Credit Issued'],
      'Partially Paid': ['Paid', 'Overdue', 'Disputed', 'Void', 'Credit Issued', 'Refunded'],
      'Paid': ['Void', 'Disputed', 'Credit Issued', 'Refunded', 'Archived'],
      'Overdue': ['Partially Paid', 'Paid', 'Disputed', 'Void', 'Credit Issued', 'Cancelled'],
      'Disputed': ['Partially Paid', 'Paid', 'Overdue', 'Void', 'Credit Issued', 'Cancelled'],
      'Cancelled': ['Archived'],
      'Void': ['Archived'],
      'Credit Issued': ['Refunded', 'Archived'],
      'Refunded': ['Archived'],
      'Archived': [],
      // Handle legacy lowercase statuses for seamless backward compatibility
      'unpaid': ['paid', 'partial', 'written_off', 'Cancelled'],
      'partial': ['paid', 'written_off'],
      'paid': ['Refunded', 'Void'],
      'overdue': ['paid', 'partial', 'written_off', 'Cancelled'],
      'written_off': ['Archived']
    };

    const allowed = validTransitions[fromStatus] || [];
    if (!allowed.includes(toStatus) && fromStatus !== toStatus) {
      throw new Error(`حظر دورة حياة: لا يمكن تحويل حالة الفاتورة من '${fromStatus}' إلى '${toStatus}'. انتقال غير نظامي.`);
    }
  }
}
