import { FallbackStorage } from '../repositories/FallbackStorage';
import { RevenueRecognitionRepository } from '../repositories/RevenueRecognitionRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { PostingEngine } from './PostingEngine';
import { EnterpriseLogger } from './EnterpriseLogger';
import { 
  Invoice, 
  RevenueRecognitionSchedule, 
  RevenueRecognitionPolicy, 
  AcademicCalendar, 
  AcademicPeriod, 
  JournalEntry,
  RevenueRecognitionAdjustment,
  FinancialConfiguration
} from '../../types';

export class AcademicRevenueRecognitionEngine {
  public static roundWithPolicy(
    amount: number,
    precision: number,
    mode: 'HalfUp' | 'HalfEven' | 'Up' | 'Down' | 'Ceiling' | 'Floor'
  ): number {
    const factor = Math.pow(10, precision);
    const shifted = amount * factor;

    let roundedShifted: number;

    switch (mode) {
      case 'Up':
        roundedShifted = shifted > 0 ? Math.ceil(shifted) : Math.floor(shifted);
        break;
      case 'Down':
        roundedShifted = shifted > 0 ? Math.floor(shifted) : Math.ceil(shifted);
        break;
      case 'Ceiling':
        roundedShifted = Math.ceil(shifted);
        break;
      case 'Floor':
        roundedShifted = Math.floor(shifted);
        break;
      case 'HalfEven': {
        const floorValue = Math.floor(shifted);
        const fracValue = shifted - floorValue;
        if (Math.abs(fracValue - 0.5) < 1e-9) {
          roundedShifted = (floorValue % 2 === 0) ? floorValue : floorValue + 1;
        } else {
          roundedShifted = Math.round(shifted);
        }
        break;
      }
      case 'HalfUp':
      default:
        roundedShifted = Math.round(shifted);
        break;
    }

    return Number((roundedShifted / factor).toFixed(precision));
  }

  public static allocateAmounts(
    invoiceTotal: number,
    standardAmounts: number[],
    precision: number,
    mode: 'HalfUp' | 'HalfEven' | 'Up' | 'Down' | 'Ceiling' | 'Floor',
    allocationPolicy: 'LastPeriodAdjustment' | 'FirstPeriodAdjustment' | 'LargestAmountAdjustment' | 'CustomAllocation'
  ): { amounts: number[], roundingDiff: number } {
    const roundedAmounts = standardAmounts.map(amt => this.roundWithPolicy(amt, precision, mode));
    const distributed = roundedAmounts.reduce((sum, val) => sum + val, 0);
    const diff = Number((invoiceTotal - distributed).toFixed(precision));

    if (diff !== 0 && roundedAmounts.length > 0) {
      if (allocationPolicy === 'FirstPeriodAdjustment') {
        roundedAmounts[0] = Number((roundedAmounts[0] + diff).toFixed(precision));
      } else if (allocationPolicy === 'LargestAmountAdjustment') {
        let largestIdx = 0;
        let largestVal = roundedAmounts[0];
        for (let i = 1; i < roundedAmounts.length; i++) {
          if (roundedAmounts[i] > largestVal) {
            largestVal = roundedAmounts[i];
            largestIdx = i;
          }
        }
        roundedAmounts[largestIdx] = Number((roundedAmounts[largestIdx] + diff).toFixed(precision));
      } else {
        // LastPeriodAdjustment or CustomAllocation (default)
        const lastIdx = roundedAmounts.length - 1;
        roundedAmounts[lastIdx] = Number((roundedAmounts[lastIdx] + diff).toFixed(precision));
      }
    }

    return {
      amounts: roundedAmounts,
      roundingDiff: diff
    };
  }

  public static findAccountIdByCode(code: string, fallbackId: string): string {
    FallbackStorage.assertCanonicalPersistence('revenue recognition account master read');
    const accounts = FallbackStorage.getAccounts();
    const found = accounts.find(a => a.code === code || a.id === code);
    return found ? found.id : fallbackId;
  }

  /**
   * Evaluates and returns the active revenue recognition policy for a school.
   */
  public static async getActivePolicy(schoolId: string): Promise<RevenueRecognitionPolicy> {
    return RevenueRecognitionRepository.getActivePolicy(schoolId);
  }

  /**
   * Generates the revenue recognition schedule for an invoice based on the active policy.
   * Following IFRS 15, if the policy is "Deferred Revenue", it registers a deferred liability
   * and plans periodic recognition.
   */
  public static async generateSchedule(
    schoolId: string,
    invoiceId: string,
    userId: string,
    userName: string
  ): Promise<RevenueRecognitionSchedule[]> {
    FallbackStorage.assertCanonicalPersistence('revenue recognition invoice read');
    // 1. Retrieve the Invoice
    const invoices = FallbackStorage.getInvoices();
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error(`الفاتورة المحددة غير موجودة: ${invoiceId}`);
    }

    // Business Rule: Prevent recognizing if invoice is written off
    if (invoice.status === 'written_off') {
      throw new Error('قيد منع: لا يمكن جدولة إيرادات لفاتورة ملغاة أو مشطوبة.');
    }

    const invoiceTotal = invoice.totalAmount ?? invoice.amount;
    if (invoiceTotal <= 0) {
      throw new Error('حظر محاسبي: لا يمكن جدولة الاعتراف بالإيراد لفاتورة قيمتها صفرية أو سالبة.');
    }

    // 2. Retrieve Active Academic Calendar
    const calendar = await RevenueRecognitionRepository.getActiveCalendar(schoolId);
    if (!calendar) {
      throw new Error('تنبيه تهيئة: لا يوجد تقويم دراسي نشط مسجل للفرع/المدرسة حالياً.');
    }

    const periods = await RevenueRecognitionRepository.getPeriods(calendar.id);
    if (periods.length === 0) {
      throw new Error('قيد معمارى: لا توجد فترات أكاديمية معرّفة داخل التقويم الدراسي الحالي.');
    }

    const terms = await RevenueRecognitionRepository.getTerms(calendar.id);

    // 3. Retrieve Active Policy
    const policy = await this.getActivePolicy(schoolId);

    // 4. Retrieve Database Configuration Settings
    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;
    const mode = config.rounding.mode;
    const allocationPolicy = config.rounding.allocationPolicy;
    const recMethod = config.revenueRecognition.method || policy.type;

    // 5. Delete existing schedules for this invoice first (clean sweep)
    await RevenueRecognitionRepository.deleteSchedulesByInvoice(invoiceId);

    const schedules: RevenueRecognitionSchedule[] = [];
    const createdAt = new Date().toISOString();

    const feeTemplateId = (invoice as any).feeTemplateId || 'default';

    let roundingDiff = 0;

    // 6. Build schedules according to config/policy type
    switch (recMethod) {
      case 'Immediate': {
        roundingDiff = 0;
        // Recognize 100% immediately on the invoice date (or today)
        schedules.push({
          id: `rev_sched_${invoiceId}_imm`,
          schoolId,
          invoiceId,
          studentId: invoice.studentId || '',
          feeTemplateId,
          academicYearId: calendar.id,
          academicPeriodId: periods[0].id,
          recognitionDate: invoice.invoiceDate || new Date().toISOString().split('T')[0],
          recognitionAmount: invoiceTotal,
          recognitionStatus: 'Scheduled',
          createdAt
        });
        break;
      }

      case 'Academic Term':
      case 'Academic Terms': {
        // Recognize based on term weight weights
        if (terms.length === 0) {
          throw new Error('تنبيه محاسبي: سياسة الاعتراف بالفصول تتطلب إدخال فصول دراسية وأوزانها.');
        }

        const standardAmts = terms.map(term => (invoiceTotal * term.weightPercent) / 100);
        const { amounts, roundingDiff: rDiff } = this.allocateAmounts(
          invoiceTotal,
          standardAmts,
          precision,
          mode,
          allocationPolicy
        );
        roundingDiff = rDiff;

        for (let i = 0; i < terms.length; i++) {
          const term = terms[i];
          const amt = amounts[i];
          
          // Find corresponding period for term start
          const period = periods.find(p => term.startDate >= p.startDate && term.startDate <= p.endDate) || periods[0];

          schedules.push({
            id: `rev_sched_${invoiceId}_term_${term.id}`,
            schoolId,
            invoiceId,
            studentId: invoice.studentId || '',
            feeTemplateId,
            academicYearId: calendar.id,
            academicPeriodId: period.id,
            recognitionDate: term.startDate,
            recognitionAmount: amt,
            recognitionStatus: 'Scheduled',
            createdAt
          });
        }
        break;
      }

      case 'Daily': {
        // Recognize daily over the entire span
        const calStart = new Date(calendar.startDate).getTime();
        const calEnd = new Date(calendar.endDate).getTime();
        const totalMs = calEnd - calStart;
        const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24)) || 300;

        const standardAmts: number[] = [];
        for (let i = 0; i < periods.length; i++) {
          const period = periods[i];
          const pStart = Math.max(calStart, new Date(period.startDate).getTime());
          const pEnd = Math.min(calEnd, new Date(period.endDate).getTime());
          const pDays = Math.max(0, Math.ceil((pEnd - pStart) / (1000 * 60 * 60 * 24))) + 1;
          standardAmts.push((invoiceTotal * pDays) / totalDays);
        }

        const { amounts, roundingDiff: rDiff } = this.allocateAmounts(
          invoiceTotal,
          standardAmts,
          precision,
          mode,
          allocationPolicy
        );
        roundingDiff = rDiff;

        for (let i = 0; i < periods.length; i++) {
          const period = periods[i];
          const amt = amounts[i];

          schedules.push({
            id: `rev_sched_${invoiceId}_daily_${period.id}`,
            schoolId,
            invoiceId,
            studentId: invoice.studentId || '',
            feeTemplateId,
            academicYearId: calendar.id,
            academicPeriodId: period.id,
            recognitionDate: period.startDate,
            recognitionAmount: amt,
            recognitionStatus: 'Scheduled',
            createdAt
          });
        }
        break;
      }

      case 'Cash Basis': {
        roundingDiff = 0;
        // For Cash Basis, we start with a single "Draft" schedule representing the invoice.
        schedules.push({
          id: `rev_sched_${invoiceId}_cash_base`,
          schoolId,
          invoiceId,
          studentId: invoice.studentId || '',
          feeTemplateId,
          academicYearId: calendar.id,
          academicPeriodId: periods[0].id,
          recognitionDate: invoice.invoiceDate || new Date().toISOString().split('T')[0],
          recognitionAmount: invoiceTotal,
          recognitionStatus: 'Draft',
          createdAt
        });
        break;
      }

      case 'Deferred Revenue':
      case 'Straight Line':
      default: {
        // Even straight-line distribution over all academic periods
        const count = periods.length;
        const standardAmts = Array(count).fill(invoiceTotal / count);
        const { amounts, roundingDiff: rDiff } = this.allocateAmounts(
          invoiceTotal,
          standardAmts,
          precision,
          mode,
          allocationPolicy
        );
        roundingDiff = rDiff;

        for (let i = 0; i < count; i++) {
          const period = periods[i];
          const amt = amounts[i];

          schedules.push({
            id: `rev_sched_${invoiceId}_sl_${period.id}`,
            schoolId,
            invoiceId,
            studentId: invoice.studentId || '',
            feeTemplateId,
            academicYearId: calendar.id,
            academicPeriodId: period.id,
            recognitionDate: period.startDate,
            recognitionAmount: amt,
            recognitionStatus: 'Scheduled',
            createdAt
          });
        }
        break;
      }
    }

    // 7. Save schedules
    await RevenueRecognitionRepository.saveSchedules(schedules);

    // 8. Post the Initial Unearned/Deferred Revenue Journal Entry if Deferred
    if (recMethod === 'Deferred Revenue') {
      await this.postInitialDeferredRevenue(schoolId, invoice, invoiceTotal, userId, userName);
    }

    // 9. Log Audit History
    const policyDesc = `تم إنشاء جدول الاعتراف بالإيراد بنجاح للفاتورة (${invoiceId}) بقيمة إجمالية (${invoiceTotal}) وفقاً لسياسة التقريب المحاسبية المعتمدة (${recMethod}) موزعة على (${schedules.length}) فترة. سياسة التقريب: توزيع القيمة المقربة بالتساوي على الفترات، وتحميل فرق تقريب الكسور المحاسبية (${roundingDiff}) بالكامل لضمان توازن الإيراد بنسبة 100%.`;
    await RevenueRecognitionRepository.logEvent(
      schoolId,
      'Create Schedule',
      userId,
      userName,
      policyDesc,
      invoiceId
    );

    return schedules;
  }

  /**
   * Posts the initial liability entry:
   * Debit: Receivables (acc_113)
   * Credit: Unearned Revenue (acc_211 or custom from config)
   */
  private static async postInitialDeferredRevenue(
    schoolId: string,
    invoice: Invoice,
    totalAmount: number,
    userId: string,
    userName: string
  ): Promise<void> {
    const entryId = `je_deferred_init_${invoice.id}_${Date.now()}`;
    const dateStr = invoice.invoiceDate || new Date().toISOString().split('T')[0];

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const deferredAcc = this.findAccountIdByCode(config.revenueRecognition.deferredRevenueAccount, 'acc_211');

    // Create journal entry draft
    const newEntry: JournalEntry = {
      id: entryId,
      date: dateStr,
      description: `إثبات الإيرادات المؤجلة غير المكتسبة والمستحقات الدراسية للفاتورة رقم ${invoice.id}`,
      status: 'draft',
      totalDebit: totalAmount,
      totalCredit: totalAmount,
      referenceType: 'invoice',
      referenceId: invoice.id,
      createdAt: new Date().toISOString(),
      items: [
        {
          accountId: 'acc_113', // ذمم الطلاب المدينين (Asset)
          debit: totalAmount,
          credit: 0
        },
        {
          accountId: deferredAcc, // الإيرادات المؤجلة غير المحققة (Liability)
          debit: 0,
          credit: totalAmount
        }
      ]
    };

    // Store the draft securely via PostingEngine
    await PostingEngine.createJournalEntryDraft(schoolId, newEntry);

    // Post it via PostingEngine to ensure full financial ledger audit trace
    await PostingEngine.postJournalEntry(schoolId, entryId, {
      userId,
      userName,
      userRole: 'Revenue Recognition Auditor',
      ipAddress: '127.0.0.1'
    });
  }

  /**
   * Performs automatic/batch recognition for a specific AcademicPeriod.
   * Recognizes scheduled amounts by transferring from Unearned/Deferred Revenue (acc_211) to Earned Tuition Revenue (acc_411).
   */
  public static async recognizePeriod(
    schoolId: string,
    periodId: string,
    userId: string,
    userName: string
  ): Promise<number> {
    FallbackStorage.assertCanonicalPersistence('revenue recognition period invoice read');
    // Validate period is not closed
    const period = await RevenueRecognitionRepository.getPeriod(periodId);
    if (!period) {
      throw new Error(`الفترة الأكاديمية المحددة غير موجودة: ${periodId}`);
    }
    if (period.isClosed) {
      throw new Error(`حظر محاسبي: لا يمكن الاعتراف بالإيرادات لفترة دراسية مغلقة محاسبياً: ${period.name}`);
    }

    const schedules = await RevenueRecognitionRepository.getSchedules(schoolId);
    const targets = schedules.filter(s => s.academicPeriodId === periodId && s.recognitionStatus === 'Scheduled');

    let totalRecognized = 0;

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const deferredAcc = this.findAccountIdByCode(config.revenueRecognition.deferredRevenueAccount, 'acc_211');
    const earnedAcc = this.findAccountIdByCode(config.revenueRecognition.earnedRevenueAccount, 'acc_411');

    for (const sched of targets) {
      // Rule validation: Ensure student is active (not withdrawn) and invoice is valid
      const invoices = FallbackStorage.getInvoices();
      const invoice = invoices.find(inv => inv.id === sched.invoiceId);
      if (!invoice || invoice.status === 'written_off') {
        sched.recognitionStatus = 'Cancelled';
        continue; // skip
      }

      // Check student withdrawal status
      const students = FallbackStorage.getStudents();
      const student = students.find(s => s.id === sched.studentId);
      if (student && student.status === 'withdrawn') {
        sched.recognitionStatus = 'Pending Adjustment';
        continue; // skip until adjustment processed
      }

      const amount = sched.recognitionAmount;
      if (amount <= 0) continue;

      // Prepare recognition entry draft
      const entryId = `je_rec_post_${sched.id}_${Date.now()}`;
      const recDate = sched.recognitionDate || new Date().toISOString().split('T')[0];

      const journal: JournalEntry = {
        id: entryId,
        date: recDate,
        description: `الاعتراف الدوري بالإيراد المكتسب للفترة ${period.name} - الفاتورة ${sched.invoiceId}`,
        status: 'draft',
        totalDebit: amount,
        totalCredit: amount,
        referenceType: 'other',
        referenceId: sched.id,
        createdAt: new Date().toISOString(),
        items: [
          {
            accountId: deferredAcc, // الإيرادات المؤجلة (Liability Debit to reduce)
            debit: amount,
            credit: 0
          },
          {
            accountId: earnedAcc, // إيرادات الرسوم المحققة (Revenue Credit to increase)
            debit: 0,
            credit: amount
          }
        ]
      };

      // Store draft securely via PostingEngine
      await PostingEngine.createJournalEntryDraft(schoolId, journal);

      // Post through PostingEngine
      try {
        await PostingEngine.postJournalEntry(schoolId, entryId, {
          userId,
          userName,
          userRole: 'Revenue Recognition Subsystem',
          ipAddress: '127.0.0.1'
        });

        // Save recognition ledger entry details
        await RevenueRecognitionRepository.saveEntry({
          id: `rec_ent_${sched.id}`,
          scheduleId: sched.id,
          schoolId,
          debitAccount: deferredAcc,
          creditAccount: earnedAcc,
          amount,
          postedDate: recDate,
          journalEntryId: entryId
        });

        sched.recognitionStatus = 'Recognized';
        sched.journalEntryId = entryId;
        sched.executionDate = new Date().toISOString();
        sched.executionUser = userName;
        totalRecognized += amount;

        // Log history
        await RevenueRecognitionRepository.logEvent(
          schoolId,
          'Recognize',
          userId,
          userName,
          `تم الاعتراف الدوري بالإيراد بنجاح بقيمة (${amount}) للفترة (${period.name}). القيد المرحل: (${entryId})`,
          sched.invoiceId,
          sched.id
        );

      } catch (err: any) {
        EnterpriseLogger.error(`Error posting recognition entry for schedule ${sched.id}: ${err.message}`, 'AcademicRevenueRecognitionEngine', { error: err });
        throw new Error(`فشل ترحيل قيد الاعتراف بالإيراد من خلال محرك الترحيل الرئيسي: ${err.message}`);
      }
    }

    // Save updated schedules
    await RevenueRecognitionRepository.saveSchedules(schedules);

    return totalRecognized;
  }

  /**
   * Adjusts schedules when student withdraws, fees are modified, refunded, or discounted.
   * Recalculates recognition schedules safely, keeping already 'Recognized' lines completely intact.
   */
  public static async handleAdjustment(
    schoolId: string,
    invoiceId: string,
    type: RevenueRecognitionAdjustment['type'],
    newTotal: number,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    FallbackStorage.assertCanonicalPersistence('revenue recognition adjustment invoice read');
    const schedules = await RevenueRecognitionRepository.getSchedulesByInvoice(invoiceId);
    if (schedules.length === 0) {
      return; // No schedules to adjust
    }

    const recognizedLines = schedules.filter(s => s.recognitionStatus === 'Recognized');
    const recognizedSum = recognizedLines.reduce((sum, s) => sum + s.recognitionAmount, 0);

    const oldTotal = schedules.reduce((sum, s) => sum + s.recognitionAmount, 0);

    // Save history adjustment record
    await RevenueRecognitionRepository.saveAdjustment({
      id: `rev_adj_${Date.now()}`,
      schoolId,
      invoiceId,
      type,
      oldTotal,
      newTotal,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      reason
    });

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;
    const mode = config.rounding.mode;
    const allocationPolicy = config.rounding.allocationPolicy;

    const remainingToRecognize = Number((newTotal - recognizedSum).toFixed(precision));

    // If the new total is less than what has already been recognized, we have an over-recognized scenario.
    // We must create an adjustment refund schedule entry immediately to reverse the difference in the current period.
    if (remainingToRecognize < 0) {
      const excess = Math.abs(remainingToRecognize);
      // Cancel all remaining scheduled lines
      schedules.forEach(s => {
        if (s.recognitionStatus === 'Scheduled' || s.recognitionStatus === 'Draft') {
          s.recognitionStatus = 'Cancelled';
        }
      });

      // Create a corrective scheduled line (negative/reversal)
      const currentPeriod = schedules.find(s => s.recognitionStatus === 'Recognized')?.academicPeriodId || schedules[0].academicPeriodId;
      const correction: RevenueRecognitionSchedule = {
        id: `rev_sched_${invoiceId}_correction_${Date.now()}`,
        schoolId,
        invoiceId,
        studentId: schedules[0].studentId,
        feeTemplateId: schedules[0].feeTemplateId,
        academicYearId: schedules[0].academicYearId,
        academicPeriodId: currentPeriod,
        recognitionDate: new Date().toISOString().split('T')[0],
        recognitionAmount: -excess,
        recognitionStatus: 'Scheduled',
        createdAt: new Date().toISOString()
      };
      schedules.push(correction);
      await RevenueRecognitionRepository.saveSchedules(schedules);

      await RevenueRecognitionRepository.logEvent(
        schoolId,
        'Recalculate',
        userId,
        userName,
        `تعديل الرسوم/انسحاب الطالب أدى إلى تجاوز ما تم الاعتراف به سابقاً. تم تخطيط قيد عكسي تسوية بقيمة (${-excess}) للفاتورة (${invoiceId}).`,
        invoiceId
      );
      return;
    }

    let adjRoundingDiff = 0;

    // Otherwise, re-distribute the remaining balance among outstanding (Scheduled/Draft) periods
    const outstandingLines = schedules.filter(s => s.recognitionStatus === 'Scheduled' || s.recognitionStatus === 'Draft');
    if (outstandingLines.length === 0) {
      adjRoundingDiff = 0;
      // If no outstanding lines but still some remaining amount to recognize, create a final schedule
      const periodId = schedules[schedules.length - 1].academicPeriodId;
      const finalLine: RevenueRecognitionSchedule = {
        id: `rev_sched_${invoiceId}_adj_final_${Date.now()}`,
        schoolId,
        invoiceId,
        studentId: schedules[0].studentId,
        feeTemplateId: schedules[0].feeTemplateId,
        academicYearId: schedules[0].academicYearId,
        academicPeriodId: periodId,
        recognitionDate: new Date().toISOString().split('T')[0],
        recognitionAmount: remainingToRecognize,
        recognitionStatus: 'Scheduled',
        createdAt: new Date().toISOString()
      };
      schedules.push(finalLine);
      await RevenueRecognitionRepository.saveSchedules(schedules);
    } else {
      // Pro-rata redistribution of remaining to recognize
      const count = outstandingLines.length;
      const standardAmts = Array(count).fill(remainingToRecognize / count);
      const { amounts, roundingDiff: rDiff } = this.allocateAmounts(
        remainingToRecognize,
        standardAmts,
        precision,
        mode,
        allocationPolicy
      );
      adjRoundingDiff = rDiff;

      for (let i = 0; i < count; i++) {
        const line = outstandingLines[i];
        line.recognitionAmount = amounts[i];
        line.recognitionStatus = 'Scheduled'; // Reset to Scheduled if it was draft
      }
      await RevenueRecognitionRepository.saveSchedules(schedules);
    }

    const adjLogDesc = `تمت إعادة جدولة خطط الاعتراف بالإيرادات بنجاح للفاتورة (${invoiceId}) بسبب تعديل (${type}). الإجمالي القديم (${oldTotal})، الجديد (${newTotal}). سياسة التقريب: توزيع المبلغ المتبقي (${remainingToRecognize}) بالتساوي على الفترات المتبقية، وتحميل فرق تقريب الكسور المحاسبية (${adjRoundingDiff}) على الفترة الأخيرة لضمان مطابقة الإيرادات بنسبة 100%.`;
    await RevenueRecognitionRepository.logEvent(
      schoolId,
      'Recalculate',
      userId,
      userName,
      adjLogDesc,
      invoiceId
    );
  }
}
