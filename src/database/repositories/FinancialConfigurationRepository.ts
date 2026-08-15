import { FallbackStorage } from './FallbackStorage';
import { FinancialConfiguration, FinancialConfigurationAuditLog } from '../../types';

export class FinancialConfigurationRepository {
  /**
   * Get the enterprise defaults for a school to guarantee 100% backward compatibility.
   */
  public static getDefaultConfiguration(schoolId: string): FinancialConfiguration {
    return {
      id: `config_${schoolId}_default`,
      schoolId: schoolId,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System Default',
      generalLedger: {
        allowDirectJournalEdits: false,
        requireDoubleEntry: true
      },
      studentNumbering: {
        studentCode: { prefix: 'STU-', suffix: '', useAcademicYear: true, useStageId: false, paddedLength: 5, lastSequenceNumber: 0 },
        academicId: { prefix: 'AC-', suffix: '', useAcademicYear: true, useStageId: false, paddedLength: 6, lastSequenceNumber: 0 },
        fileNumber: { prefix: 'FL-', suffix: '', useAcademicYear: true, useStageId: false, paddedLength: 5, lastSequenceNumber: 0 },
        registrationNumber: { prefix: 'REG-', suffix: '', useAcademicYear: true, useStageId: false, paddedLength: 6, lastSequenceNumber: 0 }
      },
      rounding: {
        precision: 2,
        mode: 'HalfUp',
        allocationPolicy: 'LastPeriodAdjustment'
      },
      currency: {
        code: 'CUR',
        precision: 2,
        symbol: '¤',
        negativeFormat: 'minus',
        thousandsSeparator: ',',
        decimalSeparator: '.'
      },
      revenueRecognition: {
        method: 'Deferred Revenue',
        deferredRevenueAccount: '2301', // Unearned Tuition Fees
        earnedRevenueAccount: '4101',    // Tuition Fees Revenue
        frequency: 'Academic Terms',
        startPolicy: 'Invoice Date'
      },
      posting: {
        requireApprovedWorkflow: false,
        autoPostInvoices: true
      },
      fiscal: {
        currentFiscalYearId: 'fy_2026'
      },
      collections: {
        allocationPolicy: 'FIFO',
        priority: ['Invoice', 'Installment', 'Receivable'],
        tieBreaking: 'DueDateAsc',
        tolerance: 0.00,
        partialAllocationPolicy: 'Allow'
      }
    };
  }

  /**
   * Fetch configuration for a specific school. If none exists, return defaults.
   */
  public static async getBySchoolId(schoolId: string): Promise<FinancialConfiguration> {
    const configs = FallbackStorage.getFinancialConfigurations();
    const found = configs.find(c => c.schoolId === schoolId);
    if (found) {
      return found;
    }
    // Fallback default
    return this.getDefaultConfiguration(schoolId);
  }

  /**
   * Update the configuration with full audits and strict validations.
   */
  public static async updateConfiguration(
    schoolId: string,
    item: Partial<FinancialConfiguration>,
    userId: string,
    userName: string,
    reason: string
  ): Promise<FinancialConfiguration> {
    // 1. Load existing or default configuration
    const current = await this.getBySchoolId(schoolId);
    const oldValueString = JSON.stringify(current);

    // 2. Build the proposed new configuration
    const proposed: FinancialConfiguration = {
      ...current,
      ...item,
      generalLedger: { ...current.generalLedger, ...item.generalLedger },
      rounding: { ...current.rounding, ...item.rounding },
      currency: { ...current.currency, ...item.currency },
      revenueRecognition: { ...current.revenueRecognition, ...item.revenueRecognition },
      posting: { ...current.posting, ...item.posting },
      fiscal: { ...current.fiscal, ...item.fiscal },
      collections: item.collections ? { ...current.collections, ...item.collections } as any : current.collections,
      schoolId, // Ensure schoolId cannot be manipulated
      updatedAt: new Date().toISOString(),
      updatedBy: userName
    };

    // 3. Strict Business Validations
    if (!proposed.rounding || !proposed.rounding.mode || proposed.rounding.precision === undefined) {
      throw new Error('مخالفة معمارية: يجب تحديد سياسة تقريب صالحة وقيمة دقة عشرية.');
    }

    if (!proposed.revenueRecognition || !proposed.revenueRecognition.method) {
      throw new Error('مخالفة معمارية: يجب تحديد سياسة واضحة للاعتراف بالإيراد.');
    }

    if (proposed.rounding.precision < 0 || proposed.rounding.precision > 4) {
      throw new Error('مخالفة محاسبية: دقة التقريب يجب أن تكون بين 0 و 4 خانات عشرية.');
    }

    if (proposed.revenueRecognition.method === 'Deferred Revenue' && !proposed.revenueRecognition.deferredRevenueAccount) {
      throw new Error('مخالفة محاسبية: يجب تحديد حساب الإيرادات المؤجلة عند استخدام طريقة الاعتراف المؤجل (Deferred Revenue).');
    }

    if (proposed.currency.precision !== proposed.rounding.precision) {
      throw new Error('مخالفة محاسبية: يجب تطابق دقة التقريب مع عدد الخانات العشرية المقررة للعملة.');
    }

    // 4. Save new configuration
    const configs = FallbackStorage.getFinancialConfigurations();
    const index = configs.findIndex(c => c.schoolId === schoolId);
    if (index >= 0) {
      configs[index] = proposed;
    } else {
      proposed.id = `config_${schoolId}_${Date.now()}`;
      configs.push(proposed);
    }
    FallbackStorage.saveFinancialConfigurations(configs);

    // 5. Log change history in the Audit Trail
    const newValueString = JSON.stringify(proposed);
    const auditLogs = FallbackStorage.getFinancialConfigurationAuditLogs();
    const newLog: FinancialConfigurationAuditLog = {
      id: `cfg_log_${schoolId}_${Date.now()}`,
      schoolId,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      oldValue: oldValueString,
      newValue: newValueString,
      changeReason: reason || 'تحديث الإعدادات المالية العامة للشركة'
    };
    auditLogs.push(newLog);
    FallbackStorage.saveFinancialConfigurationAuditLogs(auditLogs);

    return proposed;
  }

  /**
   * Fetch all audit logs for configuration changes.
   */
  public static async getAuditLogs(schoolId: string): Promise<FinancialConfigurationAuditLog[]> {
    const logs = FallbackStorage.getFinancialConfigurationAuditLogs();
    return logs.filter(l => l.schoolId === schoolId);
  }
}
