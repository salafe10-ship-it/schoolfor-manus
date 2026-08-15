/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FallbackStorage } from '../repositories/FallbackStorage';
import { AuditRepository } from '../repositories/AuditRepository';
import { InstallmentRepository } from '../repositories/InstallmentRepository';
import { FeeEligibilityEngine } from './FeeEligibilityEngine';
import { FeeStructureEngine } from './FeeStructureEngine';
import { PostingEngine } from './PostingEngine';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { CurrencyService } from './CurrencyService';
import { EnterpriseLogger } from './EnterpriseLogger';
import {
  Student,
  Invoice,
  InstallmentPlan,
  InstallmentSchedule,
  InstallmentItem,
  InstallmentPayment,
  InstallmentHistory,
  InstallmentVersion,
  InstallmentPolicy,
  InstallmentFrequency,
  InstallmentStatus
} from '../../types';

export interface PlanGenerationParams {
  schoolId: string;
  studentId: string;
  invoiceId: string;
  feeTemplateId: string;
  frequency: InstallmentFrequency;
  method: 'Equal' | 'Percentage' | 'Custom' | 'Manual' | 'Balloon';
  count: number;
  startDueDate: string;
  downPaymentPercent?: number; // e.g. 10 for 10%
  downPaymentAmount?: number;  // flat down payment
  balloonAmount?: number;      // flat final balloon payment
  percentageSequence?: number[]; // e.g. [20, 30, 50]
  customAmounts?: number[];     // Custom amounts for installments
  policy?: InstallmentPolicy;
  userId: string;
  userName: string;
  ipAddress?: string;
}

export class InstallmentEngine {
  private static roundWithPolicy(
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
  
  /**
   * Generates and persists a new Installment Plan with its nested schedules.
   * Enforces all mandatory enterprise domain business rules.
   */
  public static async createPlan(params: PlanGenerationParams): Promise<{ plan: InstallmentPlan; schedules: InstallmentSchedule[] }> {
    const { schoolId, studentId, invoiceId, feeTemplateId, frequency, method, count, startDueDate, userId, userName, ipAddress } = params;

    // RULE 1: Ensure Student Exists and is Active
    const students = FallbackStorage.getStudents();
    const student = students.find(s => s.schoolId === schoolId && s.id === studentId);
    if (!student) {
      throw new Error('حظر تجاري: لا يمكن إنشاء خطة تقسيط لطالب غير موجود بالمنظومة.');
    }

    // RULE 2: Ensure Invoice Exists
    const invoices = FallbackStorage.getInvoices();
    const invoice = invoices.find(inv => (inv as any).schoolId === schoolId && inv.id === invoiceId);
    if (!invoice) {
      throw new Error('حظر تجاري: لا يمكن إنشاء خطة تقسيط بدون فاتورة رسوم معتمدة وصالحة.');
    }

    // Check if the invoice already has an active installment plan
    const existingPlans = await InstallmentRepository.getAll(schoolId, { invoiceId });
    const activePlan = existingPlans.find(p => p.status !== 'Cancelled');
    if (activePlan) {
      throw new Error(`حظر تكرار: الفاتورة رقم (${invoiceId}) مرتبطة بالفعل بخطة تقسيط نشطة (${activePlan.id}).`);
    }

    // RULE 3: Ensure Fee Template/Structure exists and evaluate eligibility
    const templates = await FeeStructureEngine.getTemplates(schoolId);
    const template = templates.find(t => t.id === feeTemplateId);
    if (!template) {
      throw new Error('حظر تجاري: قالب الرسم المحدد غير موجود.');
    }

    const eligibility = FeeEligibilityEngine.evaluate(student, template);
    if (eligibility.status === 'Not Eligible') {
      throw new Error(`حظر أهلية: الطالب غير مؤهل لتطبيق هذا الرسم المالي والمخطط التابع له. السبب: ${eligibility.description}`);
    }

    // Resolve Policy
    const policy: InstallmentPolicy = params.policy || {
      gracePeriodDays: 5,
      penaltyRatePercent: 1.5,
      flatLateFee: 50,
      maxPenaltyPercent: 20,
      allowPenaltyWaiver: true
    };

    const totalAmount = invoice.totalAmount ?? invoice.amount;
    if (totalAmount <= 0) {
      throw new Error('قيمة الفاتورة صفرية أو سالبة، لا يمكن تقسيطها.');
    }

    // Chronological sanity check
    const todayStr = new Date().toISOString().split('T')[0];
    if (new Date(startDueDate) < new Date(invoice.createdAt || todayStr)) {
      throw new Error('تاريخ غير منطقي: لا يمكن جدولة أول قسط قبل تاريخ إنشاء الفاتورة.');
    }

    // Retrieve dynamic configuration
    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;
    const mode = config.rounding.mode;

    // Generate Schedules
    const generatedSchedules: InstallmentSchedule[] = [];
    let allocatedAmount = 0;
    const planId = `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // A. Down Payment calculation
    let currentDueDate = new Date(startDueDate);
    let installmentIndex = 1;

    let remainingTotal = totalAmount;
    let dpAmount = 0;

    if (params.downPaymentAmount && params.downPaymentAmount > 0) {
      dpAmount = params.downPaymentAmount;
    } else if (params.downPaymentPercent && params.downPaymentPercent > 0) {
      dpAmount = this.roundWithPolicy(totalAmount * params.downPaymentPercent / 100, precision, mode);
    }

    if (dpAmount > 0) {
      if (dpAmount >= totalAmount) {
        throw new Error('قيمة الدفعة المقدمة تتجاوز أو تساوي القيمة الإجمالية للفاتورة.');
      }
      const dpSchedule: InstallmentSchedule = {
        id: `sched_${planId}_dp`,
        planId,
        version: 1,
        installmentNumber: installmentIndex++,
        dueDate: invoice.createdAt?.split('T')[0] || todayStr, // Paid on day 1
        amount: dpAmount,
        paidAmount: 0,
        penaltyAmount: 0,
        waivedPenaltyAmount: 0,
        status: 'Scheduled'
      };
      generatedSchedules.push(dpSchedule);
      allocatedAmount += dpAmount;
      remainingTotal -= dpAmount;
    }

    // B. Main installments distribution
    const remainingCount = dpAmount > 0 ? count - 1 : count;
    if (remainingCount <= 0) {
      throw new Error('عدد الأقساط المتبقية بعد الدفعة المقدمة يجب أن يكون أكبر من الصفر.');
    }

    if (method === 'Equal') {
      const baseAmount = this.roundWithPolicy(remainingTotal / remainingCount, precision, mode);
      for (let i = 0; i < remainingCount; i++) {
        const schedAmount = baseAmount;
        const dueDateStr = this.addInterval(currentDueDate, frequency, i).toISOString().split('T')[0];
        
        const sched: InstallmentSchedule = {
          id: `sched_${planId}_${installmentIndex}`,
          planId,
          version: 1,
          installmentNumber: installmentIndex++,
          dueDate: dueDateStr,
          amount: schedAmount,
          paidAmount: 0,
          penaltyAmount: 0,
          waivedPenaltyAmount: 0,
          status: 'Scheduled'
        };
        generatedSchedules.push(sched);
        allocatedAmount += schedAmount;
      }
    } else if (method === 'Percentage') {
      const seq = params.percentageSequence || [];
      if (seq.length !== remainingCount) {
        throw new Error(`مصفوفة النسب المئوية (${seq.length}) لا تطابق عدد الأقساط المحددة (${remainingCount}).`);
      }
      const sumPct = seq.reduce((acc, v) => acc + v, 0);
      if (Math.abs(sumPct - 100) > 0.01) {
        throw new Error(`مجموع النسب المئوية (${sumPct}%) يجب أن يساوي 100%.`);
      }

      for (let i = 0; i < remainingCount; i++) {
        const pct = seq[i];
        const schedAmount = this.roundWithPolicy(remainingTotal * pct / 100, precision, mode);
        const dueDateStr = this.addInterval(currentDueDate, frequency, i).toISOString().split('T')[0];

        const sched: InstallmentSchedule = {
          id: `sched_${planId}_${installmentIndex}`,
          planId,
          version: 1,
          installmentNumber: installmentIndex++,
          dueDate: dueDateStr,
          amount: schedAmount,
          paidAmount: 0,
          penaltyAmount: 0,
          waivedPenaltyAmount: 0,
          status: 'Scheduled'
        };
        generatedSchedules.push(sched);
        allocatedAmount += schedAmount;
      }
    } else if (method === 'Balloon') {
      const balloon = params.balloonAmount || 0;
      if (balloon >= remainingTotal) {
        throw new Error('مبلغ قسط البالون الأخير يتجاوز القيمة الإجمالية المتبقية للفاتورة.');
      }
      const baseAmount = this.roundWithPolicy((remainingTotal - balloon) / (remainingCount - 1), precision, mode);

      for (let i = 0; i < remainingCount; i++) {
        const isLast = i === remainingCount - 1;
        const schedAmount = isLast ? balloon : baseAmount;
        const dueDateStr = this.addInterval(currentDueDate, frequency, i).toISOString().split('T')[0];

        const sched: InstallmentSchedule = {
          id: `sched_${planId}_${installmentIndex}`,
          planId,
          version: 1,
          installmentNumber: installmentIndex++,
          dueDate: dueDateStr,
          amount: schedAmount,
          paidAmount: 0,
          penaltyAmount: 0,
          waivedPenaltyAmount: 0,
          status: 'Scheduled'
        };
        generatedSchedules.push(sched);
        allocatedAmount += schedAmount;
      }
    } else if (method === 'Custom' || method === 'Manual') {
      const customs = params.customAmounts || [];
      if (customs.length !== remainingCount) {
        throw new Error(`مصفوفة المبالغ المخصصة (${customs.length}) لا تتطابق مع عدد الأقساط المجدولة (${remainingCount}).`);
      }

      for (let i = 0; i < remainingCount; i++) {
        const schedAmount = customs[i];
        if (schedAmount <= 0) {
          throw new Error('يمنع إدراج قسط بمبلغ صفري أو سالب.');
        }
        const dueDateStr = this.addInterval(currentDueDate, frequency, i).toISOString().split('T')[0];

        const sched: InstallmentSchedule = {
          id: `sched_${planId}_${installmentIndex}`,
          planId,
          version: 1,
          installmentNumber: installmentIndex++,
          dueDate: dueDateStr,
          amount: schedAmount,
          paidAmount: 0,
          penaltyAmount: 0,
          waivedPenaltyAmount: 0,
          status: 'Scheduled'
        };
        generatedSchedules.push(sched);
        allocatedAmount += schedAmount;
      }
    }

    // ROUNDING PROTECTION RULE: Ensure the sum of installments exactly matches the invoice total!
    const difference = this.roundWithPolicy(totalAmount - allocatedAmount, precision, mode);
    if (difference !== 0) {
      // Apply the rounding delta to the final installment schedule
      const finalSched = generatedSchedules[generatedSchedules.length - 1];
      finalSched.amount = this.roundWithPolicy(finalSched.amount + difference, precision, mode);
    }

    // Verify sum equals invoice grand total perfectly
    const finalSum = generatedSchedules.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(finalSum - totalAmount) > 0.05) {
      throw new Error(`خلل حسابي: مجموع الأقساط المجدولة (${finalSum}) لا يساوي إجمالي قيمة الفاتورة المعتمدة (${totalAmount}).`);
    }

    // Save Plan
    const plan = await InstallmentRepository.create(schoolId, {
      id: planId,
      schoolId,
      studentId,
      invoiceId,
      feeTemplateId,
      totalAmount,
      frequency,
      status: 'Draft',
      createdBy: userId,
      policy
    });

    // Save Schedules
    InstallmentRepository.saveSchedules(planId, generatedSchedules, 1);

    // Save Items under schedules for auditing line items
    for (const sched of generatedSchedules) {
      const mockItem: InstallmentItem = {
        id: `item_${sched.id}_1`,
        scheduleId: sched.id,
        feeItemName: template.name,
        amount: sched.amount
      };
      InstallmentRepository.saveItems(sched.id, [mockItem]);
    }

    const curSymbol = await CurrencyService.getSymbol(schoolId);

    // Log History & Audits
    const history: InstallmentHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      action: 'Create',
      version: 1,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details: `إنشاء مسودة خطة تقسيط برقم (${planId}) على الفاتورة (${invoiceId}) بمبلغ إجمالي (${totalAmount} ${curSymbol}) وطريقة توزيع (${method}).`
    };
    InstallmentRepository.saveHistory(history);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Chief ERP Architect',
      'CREATE',
      'installment_plans',
      ipAddress || '127.0.0.1',
      `تم إنشاء مسودة خطة تقسيط بمبلغ إجمالي (${totalAmount} ${curSymbol}) وطريقة توزيع (${method}) للفاتورة (${invoiceId}).`
    );

    return { plan, schedules: generatedSchedules };
  }

  /**
   * Approves a draft installment plan to lock it down.
   */
  public static async approvePlan(schoolId: string, planId: string, userId: string, userName: string, ipAddress?: string): Promise<InstallmentPlan> {
    const plan = await InstallmentRepository.getById(schoolId, planId);
    if (!plan) {
      throw new Error('خطة التقسيط غير موجودة.');
    }
    if (plan.status !== 'Draft') {
      throw new Error(`لا يمكن اعتماد خطة تقسيط في حالة غير مسودة (الحالية: ${plan.status}).`);
    }

    plan.status = 'Approved';
    plan.approvedAt = new Date().toISOString();
    plan.approvedBy = userName;

    await InstallmentRepository.update(schoolId, planId, plan);

    // Update schedules status to 'Scheduled'
    const schedules = InstallmentRepository.getSchedulesByPlanId(planId, plan.currentVersion);
    for (const s of schedules) {
      s.status = 'Scheduled';
    }
    InstallmentRepository.saveSchedules(planId, schedules, plan.currentVersion);

    const history: InstallmentHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      action: 'Approve',
      version: plan.currentVersion,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details: `اعتماد خطة التقسيط بالكامل وتفعيل جدول الاستحقاقات وجدولة السداد.`
    };
    InstallmentRepository.saveHistory(history);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Chief ERP Architect',
      'UPDATE',
      'installment_plans',
      ipAddress || '127.0.0.1',
      `اعتماد خطة تقسيط الطالب (${plan.studentId}) المرتبطة بالفاتورة (${plan.invoiceId}) بنجاح.`
    );

    return plan;
  }

  /**
   * Reschedules an existing active/approved installment plan.
   * Increments currentVersion and stores a full historic backup of the old schedules.
   */
  public static async reschedulePlan(params: {
    schoolId: string;
    planId: string;
    newSchedulesData: { dueDate: string; amount: number }[];
    reason: string;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): Promise<InstallmentPlan> {
    const { schoolId, planId, newSchedulesData, reason, userId, userName, ipAddress } = params;

    const plan = await InstallmentRepository.getById(schoolId, planId);
    if (!plan) {
      throw new Error('خطة التقسيط غير موجودة.');
    }
    if (plan.status === 'Cancelled' || plan.status === 'Completed') {
      throw new Error('لا يمكن إعادة جدولة خطة تقسيط ملغاة أو مكتملة.');
    }

    const currentSchedules = InstallmentRepository.getSchedulesByPlanId(planId, plan.currentVersion);
    
    // Validate that no paid installment is modified
    const paidSum = currentSchedules.reduce((sum, s) => sum + s.paidAmount, 0);
    const completedPayments = currentSchedules.filter(s => s.status === 'Paid' || s.paidAmount > 0);
    
    // Build snapshot of old schedules for the version history before editing
    const oldVersionNum = plan.currentVersion;
    const versionSnapshot: InstallmentVersion = {
      id: `ver_${planId}_v${oldVersionNum}`,
      planId,
      version: oldVersionNum,
      createdAt: new Date().toISOString(),
      createdBy: userName,
      reason,
      schedulesSnapshot: [...currentSchedules]
    };
    InstallmentRepository.saveVersion(versionSnapshot);

    // Verify chronological order and dates logic
    let prevDate = new Date('1970-01-01');
    for (let i = 0; i < newSchedulesData.length; i++) {
      const data = newSchedulesData[i];
      const curDate = new Date(data.dueDate);
      if (curDate < prevDate) {
        throw new Error('خطأ في الجدولة: تواريخ استحقاق الأقساط يجب أن تكون مرتبة تصاعدياً.');
      }
      prevDate = curDate;
    }

    // Verify that the sum of new schedules equals the total amount of the plan
    const newSum = newSchedulesData.reduce((sum, d) => sum + d.amount, 0);
    if (Math.abs(newSum - plan.totalAmount) > 0.01) {
      throw new Error(`خطأ إعادة جدولة: مجموع الأقساط الجديدة (${newSum}) لا يتطابق مع إجمالي قيمة الخطة المحددة (${plan.totalAmount}).`);
    }

    // Retain paid amounts from previous installments to prevent ledger leaks
    const updatedSchedules: InstallmentSchedule[] = [];
    let remainingPaidPool = paidSum;

    const nextVersionNum = oldVersionNum + 1;

    for (let i = 0; i < newSchedulesData.length; i++) {
      const data = newSchedulesData[i];
      const amount = data.amount;
      
      let schedulePaid = 0;
      if (remainingPaidPool > 0) {
        if (remainingPaidPool >= amount) {
          schedulePaid = amount;
          remainingPaidPool -= amount;
        } else {
          schedulePaid = remainingPaidPool;
          remainingPaidPool = 0;
        }
      }

      let status: InstallmentStatus = 'Scheduled';
      if (schedulePaid === amount) {
        status = 'Paid';
      } else if (schedulePaid > 0) {
        status = 'Partially Paid';
      }

      const sched: InstallmentSchedule = {
        id: `sched_${planId}_v${nextVersionNum}_${i + 1}`,
        planId,
        version: nextVersionNum,
        installmentNumber: i + 1,
        dueDate: data.dueDate,
        amount,
        paidAmount: schedulePaid,
        penaltyAmount: 0,
        waivedPenaltyAmount: 0,
        status
      };
      updatedSchedules.push(sched);
    }

    // Save updated schedules for the new version
    InstallmentRepository.saveSchedules(planId, updatedSchedules, nextVersionNum);

    // Update Plan
    plan.currentVersion = nextVersionNum;
    await InstallmentRepository.update(schoolId, planId, plan);

    // Log History and audit
    const history: InstallmentHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      action: 'Reschedule',
      version: nextVersionNum,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details: `إعادة جدولة خطة التقسيط من النسخة ${oldVersionNum} إلى النسخة ${nextVersionNum}. السبب: ${reason}`
    };
    InstallmentRepository.saveHistory(history);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Chief ERP Architect',
      'UPDATE',
      'installment_plans',
      ipAddress || '127.0.0.1',
      `تمت إعادة جدولة خطة التقسيط رقم (${planId}) وترقيتها للإصدار (${nextVersionNum}). السبب: ${reason}`
    );

    return plan;
  }

  /**
   * Evaluates late penalty for a schedule installment.
   */
  public static calculatePenalty(schedule: InstallmentSchedule, policy: InstallmentPolicy, evaluationDateStr?: string): { penalty: number; isOverdue: boolean } {
    if (schedule.status === 'Paid' || schedule.status === 'Cancelled' || schedule.status === 'Written Off') {
      return { penalty: 0, isOverdue: false };
    }

    const today = evaluationDateStr ? new Date(evaluationDateStr) : new Date();
    const dueDate = new Date(schedule.dueDate);

    if (today <= dueDate) {
      return { penalty: 0, isOverdue: false };
    }

    // Grace Period validation
    const diffTime = Math.abs(today.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= policy.gracePeriodDays) {
      return { penalty: 0, isOverdue: false }; // Still in grace period
    }

    let penalty = 0;
    if (policy.flatLateFee) {
      penalty += policy.flatLateFee;
    }
    if (policy.penaltyRatePercent) {
      const rateAmount = (schedule.amount - schedule.paidAmount) * (policy.penaltyRatePercent / 100);
      penalty += rateAmount * Math.floor(diffDays / 30); // Monthly recurring penalty
    }

    // Apply cap limit
    if (policy.maxPenaltyPercent) {
      const cap = schedule.amount * (policy.maxPenaltyPercent / 100);
      if (penalty > cap) {
        penalty = cap;
      }
    }

    const netPenalty = Math.max(0, penalty - schedule.waivedPenaltyAmount);
    return { penalty: netPenalty, isOverdue: true };
  }

  /**
   * Applies a collection payment towards a specific installment.
   * Handles Partial, Full, Advance, Overpayments, Refunds, Write-offs, and Settlements.
   */
  public static async applyPayment(params: {
    schoolId: string;
    planId: string;
    scheduleId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    type: 'Partial' | 'Full' | 'Advance' | 'Overpayment' | 'Refund' | 'Write-off' | 'Settlement';
    reason?: string;
    userId: string;
    userName: string;
    paymentDate?: string;
    ipAddress?: string;
  }): Promise<InstallmentPayment> {
    const { schoolId, planId, scheduleId, amount, paymentMethod, reference, type, reason, userId, userName, paymentDate, ipAddress } = params;

    const plan = await InstallmentRepository.getById(schoolId, planId);
    if (!plan) {
      throw new Error('خطة التقسيط غير موجودة بالمنظومة.');
    }
    if (plan.status !== 'Approved') {
      throw new Error('حظر محاسبي: لا يمكن تحصيل سداد على خطة تقسيط غير معتمدة أو ملغاة.');
    }

    const schedules = InstallmentRepository.getSchedulesByPlanId(planId, plan.currentVersion);
    const sched = schedules.find(s => s.id === scheduleId);
    if (!sched) {
      throw new Error('قسط استحقاق التقسيط المحدد غير موجود.');
    }

    if (sched.status === 'Paid' && type !== 'Refund') {
      throw new Error('القسط المالي مسدد بالكامل بالفعل ولا يحتاج لتحصيل سداد.');
    }

    // For Write-off and Settlement operations
    if (type === 'Write-off') {
      sched.writeOffAmount = amount;
      sched.status = 'Written Off';
      sched.paidAmount = sched.amount - amount;
    } else if (type === 'Settlement') {
      // Settlement represents an agreement where partial amount is paid and remaining is forgiven or resolved
      sched.paidAmount = sched.amount;
      sched.status = 'Paid';
    } else if (type === 'Refund') {
      if (sched.paidAmount < amount) {
        throw new Error('لا يمكن استرداد مبلغ أكبر من المبلغ المسدد بالقسط.');
      }
      sched.paidAmount -= amount;
      sched.status = sched.paidAmount === 0 ? 'Scheduled' : 'Partially Paid';
    } else {
      // Direct payments logic
      const remainingDue = sched.amount - sched.paidAmount;
      
      if (amount > remainingDue) {
        if (type === 'Overpayment') {
          // Record overpayment details
          sched.paidAmount = sched.amount;
          sched.status = 'Paid';
        } else if (type === 'Advance') {
          // Distribute overflow to subsequent installments (Advance Payment)
          sched.paidAmount = sched.amount;
          sched.status = 'Paid';

          let overflow = amount - remainingDue;
          const nextSchedules = schedules.filter(s => s.installmentNumber > sched.installmentNumber);
          for (const nextS of nextSchedules) {
            if (overflow <= 0) break;
            const nextDue = nextS.amount - nextS.paidAmount;
            if (overflow >= nextDue) {
              nextS.paidAmount = nextS.amount;
              nextS.status = 'Paid';
              overflow -= nextDue;
            } else {
              nextS.paidAmount += overflow;
              nextS.status = 'Partially Paid';
              overflow = 0;
            }
          }
        } else {
          // Standard payment capping
          sched.paidAmount += amount;
          sched.status = 'Paid';
        }
      } else {
        sched.paidAmount += amount;
        sched.status = sched.paidAmount === sched.amount ? 'Paid' : 'Partially Paid';
      }
    }

    // Save schedules
    InstallmentRepository.saveSchedules(planId, schedules, plan.currentVersion);

    // Record Payment
    const paymentRecord: InstallmentPayment = {
      id: `pmt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      scheduleId,
      amountPaid: amount,
      paymentDate: paymentDate || new Date().toISOString(),
      paymentMethod,
      transactionReference: reference,
      user: userName,
      type
    };
    InstallmentRepository.savePayment(paymentRecord);

    // Recalculate whole plan status
    const allSchedules = InstallmentRepository.getSchedulesByPlanId(planId, plan.currentVersion);
    const allPaid = allSchedules.every(s => s.status === 'Paid' || s.status === 'Written Off');
    if (allPaid) {
      plan.status = 'Completed';
      await InstallmentRepository.update(schoolId, planId, plan);
    }

    // Cascade update Invoice payment metrics inside FallbackStorage
    const invoices = FallbackStorage.getInvoices();
    const invoice = invoices.find(inv => inv.id === plan.invoiceId);
    if (invoice) {
      const invoiceTotal = invoice.totalAmount ?? invoice.amount;
      const currentRemaining = invoice.remainingAmount ?? invoiceTotal;
      const delta = type === 'Refund' ? amount : -amount;
      const newRemaining = Math.max(0, Math.min(invoiceTotal, currentRemaining + delta));
      invoice.remainingAmount = newRemaining;
      invoice.status = newRemaining === 0 ? 'paid' : (newRemaining < invoiceTotal ? 'partial' : 'unpaid');
      FallbackStorage.saveInvoices(invoices);
    }

    const curSymbol = await CurrencyService.getSymbol(schoolId);

    // Save History & Audit Log
    const history: InstallmentHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      action: 'Payment',
      version: plan.currentVersion,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details: `تسجيل عملية دفع من نوع (${type}) بمبلغ (${amount} ${curSymbol}) على القسط رقم (${sched.installmentNumber}) وطريقة دفع (${paymentMethod}).`
    };
    InstallmentRepository.saveHistory(history);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'ERP Finance Consultant',
      'CREATE',
      'installment_payments',
      ipAddress || '127.0.0.1',
      `تسجيل دفعة بقيمة (${amount} ${curSymbol}) وطريقة دفع (${paymentMethod}) لقسط التقسيط رقم (${sched.installmentNumber}).`
    );

    return paymentRecord;
  }

  /**
   * Applies a waiver for computed late penalty.
   */
  public static async applyPenaltyWaiver(params: {
    schoolId: string;
    planId: string;
    scheduleId: string;
    waiveAmount: number;
    reason: string;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): Promise<InstallmentSchedule> {
    const { schoolId, planId, scheduleId, waiveAmount, reason, userId, userName, ipAddress } = params;

    const plan = await InstallmentRepository.getById(schoolId, planId);
    if (!plan) {
      throw new Error('خطة التقسيط غير موجودة.');
    }
    if (!plan.policy.allowPenaltyWaiver) {
      throw new Error('حظر سياسة: سياسة السداد الحالية لا تسمح بإعفاءات أو خصومات الغرامات المالية.');
    }

    const schedules = InstallmentRepository.getSchedulesByPlanId(planId, plan.currentVersion);
    const sched = schedules.find(s => s.id === scheduleId);
    if (!sched) {
      throw new Error('قسط التقسيط المالي غير موجود.');
    }

    sched.waivedPenaltyAmount = (sched.waivedPenaltyAmount || 0) + waiveAmount;
    InstallmentRepository.saveSchedules(planId, schedules, plan.currentVersion);

    const curSymbol = await CurrencyService.getSymbol(schoolId);

    // Save History & Audit
    const history: InstallmentHistory = {
      id: `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      planId,
      action: 'Refund', // Waiver tracked inside waiver action
      version: plan.currentVersion,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      details: `تقديم إعفاء من الغرامات المالية بقيمة (${waiveAmount} ${curSymbol}) للقسط رقم (${sched.installmentNumber}). السبب: ${reason}`
    };
    InstallmentRepository.saveHistory(history);

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      'Internal Audit Specialist',
      'UPDATE',
      'installment_schedules',
      ipAddress || '127.0.0.1',
      `إعفاء الطالب من غرامة مالية مستحقة بقيمة (${waiveAmount} ${curSymbol}) للقسط (${sched.installmentNumber}).`
    );

    return sched;
  }

  /**
   * Performs Bulk Plans Creation for a collection of invoices.
   */
  public static async bulkCreatePlans(params: {
    schoolId: string;
    invoiceIds: string[];
    feeTemplateId: string;
    frequency: InstallmentFrequency;
    method: 'Equal' | 'Percentage';
    count: number;
    startDueDate: string;
    policy?: InstallmentPolicy;
    userId: string;
    userName: string;
    ipAddress?: string;
  }): Promise<number> {
    let successCount = 0;
    for (const invId of params.invoiceIds) {
      try {
        const invoices = FallbackStorage.getInvoices();
        const invoice = invoices.find(inv => inv.id === invId);
        if (!invoice) continue;

        await this.createPlan({
          schoolId: params.schoolId,
          studentId: invoice.studentId,
          invoiceId: invId,
          feeTemplateId: params.feeTemplateId,
          frequency: params.frequency,
          method: params.method,
          count: params.count,
          startDueDate: params.startDueDate,
          policy: params.policy,
          userId: params.userId,
          userName: params.userName,
          ipAddress: params.ipAddress
        });
        successCount++;
      } catch (err: any) {
        EnterpriseLogger.error(`Bulk generation failed for invoice ${invId}:`, "InstallmentEngine", { error: err?.message || err });
      }
    }
    return successCount;
  }

  /**
   * Helper utility to increment dates based on plan frequencies.
   */
  private static addInterval(baseDate: Date, frequency: InstallmentFrequency, step: number): Date {
    const res = new Date(baseDate.getTime());
    if (step === 0) return res;

    switch (frequency) {
      case 'Weekly':
        res.setDate(res.getDate() + 7 * step);
        break;
      case 'Monthly':
        res.setMonth(res.getMonth() + 1 * step);
        break;
      case 'Quarterly':
        res.setMonth(res.getMonth() + 3 * step);
        break;
      case 'Semi Annual':
        res.setMonth(res.getMonth() + 6 * step);
        break;
      case 'Annual':
        res.setFullYear(res.getFullYear() + 1 * step);
        break;
      default:
        res.setMonth(res.getMonth() + 1 * step); // Fallback monthly
        break;
    }
    return res;
  }

  /**
   * Adjusts an installment plan dynamically when the linked invoice is modified
   * via an authorized business engine event (like a Credit Note or a Debit Note).
   * Enforces absolute consistency between invoice financial totals and installment schedules.
   */
  public static async adjustPlanForInvoiceAmountChange(
    schoolId: string,
    invoiceId: string,
    newInvoiceTotal: number,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    const plans = await InstallmentRepository.getAll(schoolId, { invoiceId });
    const activePlan = plans.find(p => p.status !== 'Cancelled');
    if (!activePlan) {
      return; // No active plan for this invoice, nothing to adjust
    }

    const currentSchedules = InstallmentRepository.getSchedulesByPlanId(activePlan.id, activePlan.currentVersion);
    const paidSum = currentSchedules.reduce((sum, s) => sum + s.paidAmount, 0);

    // Create a new version/snapshot of schedules before editing
    const oldVersionNum = activePlan.currentVersion;
    const versionSnapshot: InstallmentVersion = {
      id: `ver_${activePlan.id}_v${oldVersionNum}`,
      planId: activePlan.id,
      version: oldVersionNum,
      createdAt: new Date().toISOString(),
      createdBy: userName,
      reason: `Automated adjustment: ${reason}`,
      schedulesSnapshot: [...currentSchedules]
    };
    InstallmentRepository.saveVersion(versionSnapshot);

    const nextVersionNum = oldVersionNum + 1;
    const unpaidSchedules = currentSchedules.filter(s => s.status !== 'Paid');

    if (unpaidSchedules.length === 0) {
      EnterpriseLogger.warn(`Attempted to adjust installment plan ${activePlan.id}, but all installments are already paid.`, "InstallmentEngine");
      return;
    }

    const totalRemainingToAllocate = Math.max(0, newInvoiceTotal - paidSum);

    if (totalRemainingToAllocate === 0) {
      const updatedSchedules = currentSchedules.map(s => {
        if (s.status !== 'Paid') {
          return {
            ...s,
            amount: s.paidAmount,
            status: 'Paid' as const,
            version: nextVersionNum
          };
        }
        return { ...s, version: nextVersionNum };
      });

      InstallmentRepository.saveSchedules(activePlan.id, updatedSchedules, nextVersionNum);
      await InstallmentRepository.update(schoolId, activePlan.id, {
        totalAmount: newInvoiceTotal,
        currentVersion: nextVersionNum,
        status: 'Completed'
      });
    } else {
      const currentUnpaidAmountSum = unpaidSchedules.reduce((sum, s) => sum + (s.amount - s.paidAmount), 0);
      
      const updatedSchedules = currentSchedules.map(s => {
        if (s.status !== 'Paid') {
          const originalUnpaid = s.amount - s.paidAmount;
          let newUnpaidAllocated = 0;
          if (currentUnpaidAmountSum > 0) {
            newUnpaidAllocated = (originalUnpaid / currentUnpaidAmountSum) * totalRemainingToAllocate;
          } else {
            newUnpaidAllocated = totalRemainingToAllocate / unpaidSchedules.length;
          }
          const newTotalAmount = s.paidAmount + newUnpaidAllocated;
          return {
            ...s,
            amount: Math.round(newTotalAmount * 100) / 100,
            status: newUnpaidAllocated === 0 ? ('Paid' as const) : s.status,
            version: nextVersionNum
          };
        }
        return { ...s, version: nextVersionNum };
      });

      const finalSum = updatedSchedules.reduce((sum, s) => sum + s.amount, 0);
      const diff = newInvoiceTotal - finalSum;
      if (Math.abs(diff) > 0.01 && unpaidSchedules.length > 0) {
        const lastUnpaid = updatedSchedules.find(s => s.status !== 'Paid');
        if (lastUnpaid) {
          lastUnpaid.amount = Math.round((lastUnpaid.amount + diff) * 100) / 100;
        }
      }

      InstallmentRepository.saveSchedules(activePlan.id, updatedSchedules, nextVersionNum);
      await InstallmentRepository.update(schoolId, activePlan.id, {
        totalAmount: newInvoiceTotal,
        currentVersion: nextVersionNum
      });
    }
  }
}
