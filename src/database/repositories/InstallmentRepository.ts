/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IBaseRepository } from './IBaseRepository';
import { FallbackStorage } from './FallbackStorage';
import { 
  InstallmentPlan, 
  InstallmentSchedule, 
  InstallmentItem, 
  InstallmentPayment, 
  InstallmentHistory, 
  InstallmentVersion 
} from '../../types';

/**
 * Enterprise Repository for handling CRUD and relational queries of Installment systems.
 * Fully isolated by tenant schoolId to meet multi-school deployment standards.
 */
export class InstallmentRepository implements IBaseRepository<InstallmentPlan> {
  
  public async getById(schoolId: string, id: string): Promise<InstallmentPlan | null> {
    return InstallmentRepository.getById(schoolId, id);
  }

  public async getAll(schoolId: string, options?: any): Promise<InstallmentPlan[]> {
    return InstallmentRepository.getAll(schoolId, options);
  }

  public async create(schoolId: string, item: Partial<InstallmentPlan>): Promise<InstallmentPlan> {
    return InstallmentRepository.create(schoolId, item);
  }

  public async update(schoolId: string, id: string, item: Partial<InstallmentPlan>): Promise<InstallmentPlan> {
    return InstallmentRepository.update(schoolId, id, item);
  }

  public async delete(schoolId: string, id: string): Promise<boolean> {
    return InstallmentRepository.delete(schoolId, id);
  }

  public async exists(schoolId: string, id: string): Promise<boolean> {
    return InstallmentRepository.exists(schoolId, id);
  }

  public async count(schoolId: string, options?: any): Promise<number> {
    return InstallmentRepository.count(schoolId, options);
  }

  // --- STATIC ENTERPRISE METHODS FOR TENANT ISOLATION ---

  public static async getById(schoolId: string, id: string): Promise<InstallmentPlan | null> {
    const plans = FallbackStorage.getInstallmentPlans();
    const plan = plans.find(p => p.schoolId === schoolId && p.id === id);
    return plan || null;
  }

  public static async getAll(
    schoolId: string, 
    options?: { studentId?: string; invoiceId?: string; status?: string }
  ): Promise<InstallmentPlan[]> {
    let plans = FallbackStorage.getInstallmentPlans().filter(p => p.schoolId === schoolId);

    if (options?.studentId) {
      plans = plans.filter(p => p.studentId === options.studentId);
    }
    if (options?.invoiceId) {
      plans = plans.filter(p => p.invoiceId === options.invoiceId);
    }
    if (options?.status) {
      plans = plans.filter(p => p.status === options.status);
    }

    return plans;
  }

  public static async create(schoolId: string, item: Partial<InstallmentPlan>): Promise<InstallmentPlan> {
    if (!item.studentId || !item.invoiceId || !item.feeTemplateId) {
      throw new Error('فشل الحفظ: لا يمكن إنشاء خطة تقسيط بدون طالب أو فاتورة أو رسم مرتبطة بها.');
    }

    const plans = FallbackStorage.getInstallmentPlans();
    
    const newPlan: InstallmentPlan = {
      id: item.id || `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId,
      studentId: item.studentId,
      invoiceId: item.invoiceId,
      feeTemplateId: item.feeTemplateId,
      totalAmount: item.totalAmount || 0,
      frequency: item.frequency || 'Monthly',
      status: item.status || 'Draft',
      createdAt: item.createdAt || new Date().toISOString(),
      createdBy: item.createdBy || 'system',
      approvedAt: item.approvedAt,
      approvedBy: item.approvedBy,
      currentVersion: item.currentVersion || 1,
      policy: item.policy || {
        gracePeriodDays: 5,
        allowPenaltyWaiver: true
      }
    };

    plans.push(newPlan);
    FallbackStorage.saveInstallmentPlans(plans);
    return newPlan;
  }

  public static async update(schoolId: string, id: string, item: Partial<InstallmentPlan>): Promise<InstallmentPlan> {
    const plans = FallbackStorage.getInstallmentPlans();
    const idx = plans.findIndex(p => p.schoolId === schoolId && p.id === id);
    if (idx === -1) {
      throw new Error('خطة التقسيط غير موجودة.');
    }

    const updatedPlan: InstallmentPlan = {
      ...plans[idx],
      ...item,
      id,
      schoolId // Ensure schoolId cannot be hijacked or altered
    };

    plans[idx] = updatedPlan;
    FallbackStorage.saveInstallmentPlans(plans);
    return updatedPlan;
  }

  public static async delete(schoolId: string, id: string): Promise<boolean> {
    const plans = FallbackStorage.getInstallmentPlans();
    const idx = plans.findIndex(p => p.schoolId === schoolId && p.id === id);
    if (idx === -1) return false;

    // Check if any payment was collected
    const payments = FallbackStorage.getInstallmentPayments();
    const hasPayments = payments.some(pay => pay.planId === id);
    if (hasPayments) {
      throw new Error('حظر حذف: لا يمكن حذف خطة تقسيط تم تحصيل سداد عليها بالفعل.');
    }

    plans.splice(idx, 1);
    FallbackStorage.saveInstallmentPlans(plans);

    // Cascade delete schedules, items, histories, and versions of the plan
    const schedules = FallbackStorage.getInstallmentSchedules();
    const schedulesLeft = schedules.filter(s => s.planId !== id);
    FallbackStorage.saveInstallmentSchedules(schedulesLeft);

    const schedIds = schedules.filter(s => s.planId === id).map(s => s.id);
    const items = FallbackStorage.getInstallmentItems();
    const itemsLeft = items.filter(it => !schedIds.includes(it.scheduleId));
    FallbackStorage.saveInstallmentItems(itemsLeft);

    const histories = FallbackStorage.getInstallmentHistories();
    const historiesLeft = histories.filter(h => h.planId !== id);
    FallbackStorage.saveInstallmentHistories(historiesLeft);

    const versions = FallbackStorage.getInstallmentVersions();
    const versionsLeft = versions.filter(v => v.planId !== id);
    FallbackStorage.saveInstallmentVersions(versionsLeft);

    return true;
  }

  public static async exists(schoolId: string, id: string): Promise<boolean> {
    const plans = FallbackStorage.getInstallmentPlans();
    return plans.some(p => p.schoolId === schoolId && p.id === id);
  }

  public static async count(schoolId: string, options?: any): Promise<number> {
    const plans = await this.getAll(schoolId, options);
    return plans.length;
  }

  // --- RELATED DOMAIN COLLECTION ACCESSORS ---

  public static getSchedulesByPlanId(planId: string, version?: number): InstallmentSchedule[] {
    let schedules = FallbackStorage.getInstallmentSchedules().filter(s => s.planId === planId);
    if (version !== undefined) {
      schedules = schedules.filter(s => s.version === version);
    }
    return schedules.sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  public static saveSchedules(planId: string, newSchedules: InstallmentSchedule[], version: number) {
    const allSchedules = FallbackStorage.getInstallmentSchedules();
    // Filter out old schedules for the same plan and version
    const filtered = allSchedules.filter(s => !(s.planId === planId && s.version === version));
    filtered.push(...newSchedules);
    FallbackStorage.saveInstallmentSchedules(filtered);
  }

  public static getItemsByScheduleId(scheduleId: string): InstallmentItem[] {
    return FallbackStorage.getInstallmentItems().filter(it => it.scheduleId === scheduleId);
  }

  public static saveItems(scheduleId: string, newItems: InstallmentItem[]) {
    const allItems = FallbackStorage.getInstallmentItems();
    const filtered = allItems.filter(it => it.scheduleId !== scheduleId);
    filtered.push(...newItems);
    FallbackStorage.saveInstallmentItems(filtered);
  }

  public static getPaymentsByPlanId(planId: string): InstallmentPayment[] {
    return FallbackStorage.getInstallmentPayments().filter(p => p.planId === planId);
  }

  public static savePayment(payment: InstallmentPayment) {
    const payments = FallbackStorage.getInstallmentPayments();
    payments.push(payment);
    FallbackStorage.saveInstallmentPayments(payments);
  }

  public static getHistoryByPlanId(planId: string): InstallmentHistory[] {
    return FallbackStorage.getInstallmentHistories().filter(h => h.planId === planId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public static saveHistory(history: InstallmentHistory) {
    const histories = FallbackStorage.getInstallmentHistories();
    histories.push(history);
    FallbackStorage.saveInstallmentHistories(histories);
  }

  public static getVersionsByPlanId(planId: string): InstallmentVersion[] {
    return FallbackStorage.getInstallmentVersions().filter(v => v.planId === planId)
      .sort((a, b) => a.version - b.version);
  }

  public static saveVersion(versionSnapshot: InstallmentVersion) {
    const versions = FallbackStorage.getInstallmentVersions();
    versions.push(versionSnapshot);
    FallbackStorage.saveInstallmentVersions(versions);
  }
}
