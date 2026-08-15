/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Invoice } from '../../types';
import { AuditRepository } from '../repositories/AuditRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { FeeEligibilityEngine, EligibilityRules } from './FeeEligibilityEngine';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { InvoiceEngine } from './InvoiceEngine';
import { EnterpriseLogger } from './EnterpriseLogger';

// --- ENTERPRISE FEE STRUCTURE INTERFACES ---

export interface FeeCategory {
  id: string;
  schoolId: string;
  name: string; // e.g. "الرسوم الدراسية", "رسوم النقل", "الأنشطة", "الزي المدرسي", "الكتب والقرطاسية"
  code: string; // e.g. "TUITION", "TRANSPORT", "ACTIVITY", "UNIFORM", "BOOKS"
}

export interface FeeType {
  id: string;
  schoolId: string;
  name: string; // e.g. "إجباري", "اختياري"
  isMandatory: boolean;
}

export interface TaxRule {
  isTaxable: boolean;
  taxPercent: number; // e.g. 15 for 15% VAT
  taxAccountCode?: string; // e.g. "2105" (VAT Output account)
}

export interface PostingRule {
  debitAccountCode: string; // e.g. "1201" (Student Accounts Receivable)
  creditAccountCode: string; // e.g. "4101" (Tuition Revenue account)
  triggerOn: 'assignment' | 'invoice_generation' | 'payment';
}

export interface AccountingPolicy {
  revenueRecognition: 'accrual' | 'cash';
  allowInstallments: boolean;
  installmentType?: 'monthly' | 'quarterly' | 'yearly';
}

export interface FeeAccountMapping {
  revenueAccountCode: string; // Required revenue ledger account
  costCenterId: string; // Required cost center
  taxRule: TaxRule;
  postingRule: PostingRule;
  accountingPolicy: AccountingPolicy;
}

export interface FeeItem {
  id: string;
  name: string; // e.g. "رسوم الفصل الدراسي الأول"
  code: string; // e.g. "FE-TERM1"
  amount: number;
  remarks?: string;
}

export interface FeeVersion {
  version: number;
  isActive: boolean;
  replacedByVersion?: number;
  createdAt: string;
  createdBy: string;
  changeNotes?: string;
}

export interface FeeTemplate {
  id: string;
  schoolId: string;
  fiscalYearId: string; // e.g. "fy_2026"
  code: string; // Unique fee code e.g. "TMP-HIGH-2026"
  name: string; // Unique fee name inside the same fiscal year
  category: string; // "Tuition" | "Transport" | "Activities" | "Uniform" | "Books"
  scheduleType: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  isMandatory: boolean; // Mandatory vs Optional fee rules
  items: FeeItem[];
  mapping: FeeAccountMapping;
  version: FeeVersion;

  // Revenue Recognition Policy fields
  recognitionPolicy?: 'immediate' | 'cash' | 'deferred_revenue';
  deferredRevenueAccount?: string;
  revenueRecognitionMethod?: string; // e.g. "straight_line", "manual"
  recognitionStartDate?: string;
  recognitionEndDate?: string;

  // Effective Dating fields
  effectiveFrom?: string; // YYYY-MM-DD
  effectiveTo?: string;   // YYYY-MM-DD

  // Eligibility Rules reference
  eligibilityRules?: EligibilityRules;
}

export interface FeeRule {
  id: string;
  schoolId: string;
  templateId: string;
  targetType: 'stage' | 'grade' | 'class' | 'program' | 'individual_student';
  targetValue: string; // ID / Code value of the target
  isMandatory: boolean;
}

export interface FeeAssignment {
  id: string;
  schoolId: string;
  studentId: string;
  templateId: string;
  templateVersion: number;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'suspended' | 'completed';
  optInConfirmed: boolean; // For optional fees
  customDiscountPercent?: number; // Scholar/sibling discounts
}

// --- HARDCODED SEED FEE DATA ---
const defaultCategories: FeeCategory[] = [
  { id: 'cat_tuition', schoolId: 'school_1', name: 'الرسوم الدراسية الأساسية', code: 'TUITION' },
  { id: 'cat_transport', schoolId: 'school_1', name: 'رسوم النقل والمواصلات', code: 'TRANSPORT' },
  { id: 'cat_uniform', schoolId: 'school_1', name: 'رسوم الزي المدرسي والملحقات', code: 'UNIFORM' },
  { id: 'cat_books', schoolId: 'school_1', name: 'رسوم الكتب المدرسية والقرطاسية', code: 'BOOKS' }
];

const defaultTemplates: FeeTemplate[] = [
  {
    id: 'tmpl_high_tuition_2026',
    schoolId: 'school_1',
    fiscalYearId: 'fy_2026',
    code: 'FEE-SEC-TUI',
    name: 'قسط الرسوم الدراسية السنوية للمرحلة الثانوية',
    category: 'Tuition',
    scheduleType: 'yearly',
    isMandatory: true,
    items: [
      { id: 'itm_1', name: 'القسط الدراسي السنوي الأساسي', code: 'TUI-BASE', amount: 3000 }
    ],
    mapping: {
      revenueAccountCode: '4101', // إيرادات الرسوم الدراسية
      costCenterId: 'cc_high', // مركز تكلفة الثانوي
      taxRule: { isTaxable: true, taxPercent: 15, taxAccountCode: '2105' },
      postingRule: { debitAccountCode: '1201', creditAccountCode: '4101', triggerOn: 'invoice_generation' },
      accountingPolicy: { revenueRecognition: 'accrual', allowInstallments: true, installmentType: 'quarterly' }
    },
    version: {
      version: 1,
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      createdBy: 'sys_admin',
      changeNotes: 'النسخة المبدئية المعتمدة للعام الدراسي 2026'
    },
    recognitionPolicy: 'deferred_revenue',
    deferredRevenueAccount: '2201',
    revenueRecognitionMethod: 'straight_line',
    recognitionStartDate: '2026-09-01',
    recognitionEndDate: '2027-06-30',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    eligibilityRules: { stageId: 'stage_high' }
  },
  {
    id: 'tmpl_primary_tuition_2026',
    schoolId: 'school_1',
    fiscalYearId: 'fy_2026',
    code: 'FEE-PRI-TUI',
    name: 'قسط الرسوم الدراسية السنوية للمرحلة الابتدائية',
    category: 'Tuition',
    scheduleType: 'yearly',
    isMandatory: true,
    items: [
      { id: 'itm_2', name: 'القسط الدراسي الابتدائي الأساسي', code: 'TUI-PRI-BASE', amount: 1500 }
    ],
    mapping: {
      revenueAccountCode: '4101',
      costCenterId: 'cc_primary', // مركز تكلفة الابتدائي
      taxRule: { isTaxable: true, taxPercent: 15, taxAccountCode: '2105' },
      postingRule: { debitAccountCode: '1201', creditAccountCode: '4101', triggerOn: 'invoice_generation' },
      accountingPolicy: { revenueRecognition: 'accrual', allowInstallments: true, installmentType: 'quarterly' }
    },
    version: {
      version: 1,
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      createdBy: 'sys_admin',
      changeNotes: 'قالب الرسوم الابتدائية الافتراضي'
    },
    recognitionPolicy: 'deferred_revenue',
    deferredRevenueAccount: '2201',
    revenueRecognitionMethod: 'straight_line',
    recognitionStartDate: '2026-09-01',
    recognitionEndDate: '2027-06-30',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    eligibilityRules: { stageId: 'stage_primary' }
  },
  {
    id: 'tmpl_optional_bus_2026',
    schoolId: 'school_1',
    fiscalYearId: 'fy_2026',
    code: 'FEE-BUS-OPT',
    name: 'اشتراك حافلة المدرسة الاختياري',
    category: 'Transport',
    scheduleType: 'monthly',
    isMandatory: false,
    items: [
      { id: 'itm_3', name: 'الرسوم الشهرية للنقل المدرسي اتجاهين', code: 'BUS-MONTH', amount: 200 }
    ],
    mapping: {
      revenueAccountCode: '4102', // إيرادات الخدمات الأخرى والنقل
      costCenterId: 'cc_kg', // مركز التكلفة الافتراضي
      taxRule: { isTaxable: false, taxPercent: 0 },
      postingRule: { debitAccountCode: '1201', creditAccountCode: '4102', triggerOn: 'invoice_generation' },
      accountingPolicy: { revenueRecognition: 'cash', allowInstallments: false }
    },
    version: {
      version: 1,
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      createdBy: 'sys_admin',
      changeNotes: 'رسوم النقل والترحيل الاختيارية'
    },
    recognitionPolicy: 'cash',
    revenueRecognitionMethod: 'cash',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    eligibilityRules: { allowedStatuses: ['active'] }
  }
];

const defaultAssignments: FeeAssignment[] = [
  {
    id: 'asg_1',
    schoolId: 'school_1',
    studentId: 'stud_1', // خالد بن وليد الميمان
    templateId: 'tmpl_high_tuition_2026',
    templateVersion: 1,
    assignedAt: '2026-01-05T09:00:00Z',
    assignedBy: 'sys_admin',
    status: 'active',
    optInConfirmed: true
  },
  {
    id: 'asg_2',
    schoolId: 'school_1',
    studentId: 'stud_2', // يوسف بن أحمد الزهراني
    templateId: 'tmpl_high_tuition_2026',
    templateVersion: 1,
    assignedAt: '2026-01-05T09:15:00Z',
    assignedBy: 'sys_admin',
    status: 'active',
    optInConfirmed: true
  },
  {
    id: 'asg_3',
    schoolId: 'school_1',
    studentId: 'stud_5', // ريناد بنت رائد المطيري (ابتدائي)
    templateId: 'tmpl_primary_tuition_2026',
    templateVersion: 1,
    assignedAt: '2026-01-10T10:00:00Z',
    assignedBy: 'sys_admin',
    status: 'active',
    optInConfirmed: true
  }
];

const isServer = typeof window === 'undefined';

export class FeeStructureEngine {
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

  private static categories: FeeCategory[] = [];
  private static templates: FeeTemplate[] = [];
  private static assignments: FeeAssignment[] = [];
  private static rules: FeeRule[] = [];
  private static initialized = false;

  /**
   * Safe persistent database file read/write helper
   */
  private static async initEngine() {
    if (this.initialized) return;

    if (isServer) {
      try {
        const fsName = 'fs';
        const pathName = 'path';
        const fsMod = await import(/* @vite-ignore */ fsName);
        const pathMod = await import(/* @vite-ignore */ pathName);
        const fs = fsMod.default || fsMod;
        const path = pathMod.default || pathMod;
        const dbDir = path.join(process.cwd(), 'src', 'db');

        // Categories
        const catFile = path.join(dbDir, 'fee_categories_database.json');
        if (fs.existsSync(catFile)) {
          this.categories = JSON.parse(fs.readFileSync(catFile, 'utf8'));
        } else {
          this.categories = [...defaultCategories];
          fs.writeFileSync(catFile, JSON.stringify(this.categories, null, 2), 'utf8');
        }

        // Templates
        const tmplFile = path.join(dbDir, 'fee_templates_database.json');
        if (fs.existsSync(tmplFile)) {
          this.templates = JSON.parse(fs.readFileSync(tmplFile, 'utf8'));
        } else {
          this.templates = [...defaultTemplates];
          fs.writeFileSync(tmplFile, JSON.stringify(this.templates, null, 2), 'utf8');
        }

        // Assignments
        const asgFile = path.join(dbDir, 'fee_assignments_database.json');
        if (fs.existsSync(asgFile)) {
          this.assignments = JSON.parse(fs.readFileSync(asgFile, 'utf8'));
        } else {
          this.assignments = [...defaultAssignments];
          fs.writeFileSync(asgFile, JSON.stringify(this.assignments, null, 2), 'utf8');
        }

        // Rules
        const ruleFile = path.join(dbDir, 'fee_rules_database.json');
        if (fs.existsSync(ruleFile)) {
          this.rules = JSON.parse(fs.readFileSync(ruleFile, 'utf8'));
        } else {
          this.rules = [];
          fs.writeFileSync(ruleFile, JSON.stringify(this.rules, null, 2), 'utf8');
        }

      } catch (err: any) {
        EnterpriseLogger.error("Failed to load Fee Engine databases, using memory array fallback:", "FeeStructureEngine", { error: err?.message || err });
        this.categories = [...defaultCategories];
        this.templates = [...defaultTemplates];
        this.assignments = [...defaultAssignments];
        this.rules = [];
      }
    } else {
      // LocalStorage mode
      try {
        const catKey = 'school_db_fee_categories_database.json';
        const tmplKey = 'school_db_fee_templates_database.json';
        const asgKey = 'school_db_fee_assignments_database.json';
        const ruleKey = 'school_db_fee_rules_database.json';

        const rawCat = localStorage.getItem(catKey);
        this.categories = rawCat ? JSON.parse(rawCat) : [...defaultCategories];
        if (!rawCat) localStorage.setItem(catKey, JSON.stringify(this.categories));

        const rawTmpl = localStorage.getItem(tmplKey);
        this.templates = rawTmpl ? JSON.parse(rawTmpl) : [...defaultTemplates];
        if (!rawTmpl) localStorage.setItem(tmplKey, JSON.stringify(this.templates));

        const rawAsg = localStorage.getItem(asgKey);
        this.assignments = rawAsg ? JSON.parse(rawAsg) : [...defaultAssignments];
        if (!rawAsg) localStorage.setItem(asgKey, JSON.stringify(this.assignments));

        const rawRules = localStorage.getItem(ruleKey);
        this.rules = rawRules ? JSON.parse(rawRules) : [];
        if (!rawRules) localStorage.setItem(ruleKey, JSON.stringify(this.rules));

      } catch (err: any) {
        EnterpriseLogger.error("Local storage read for Fee Engine failed:", "FeeStructureEngine", { error: err?.message || err });
      }
    }

    this.initialized = true;
  }

  private static async persistData() {
    if (isServer) {
      try {
        const fsName = 'fs';
        const pathName = 'path';
        const fsMod = await import(/* @vite-ignore */ fsName);
        const pathMod = await import(/* @vite-ignore */ pathName);
        const fs = fsMod.default || fsMod;
        const path = pathMod.default || pathMod;
        const dbDir = path.join(process.cwd(), 'src', 'db');

        fs.writeFileSync(path.join(dbDir, 'fee_categories_database.json'), JSON.stringify(this.categories, null, 2), 'utf8');
        fs.writeFileSync(path.join(dbDir, 'fee_templates_database.json'), JSON.stringify(this.templates, null, 2), 'utf8');
        fs.writeFileSync(path.join(dbDir, 'fee_assignments_database.json'), JSON.stringify(this.assignments, null, 2), 'utf8');
        fs.writeFileSync(path.join(dbDir, 'fee_rules_database.json'), JSON.stringify(this.rules, null, 2), 'utf8');
      } catch (err: any) {
        EnterpriseLogger.error("Failed to persist Fee Engine files:", "FeeStructureEngine", { error: err?.message || err });
      }
    } else {
      try {
        localStorage.setItem('school_db_fee_categories_database.json', JSON.stringify(this.categories));
        localStorage.setItem('school_db_fee_templates_database.json', JSON.stringify(this.templates));
        localStorage.setItem('school_db_fee_assignments_database.json', JSON.stringify(this.assignments));
        localStorage.setItem('school_db_fee_rules_database.json', JSON.stringify(this.rules));
      } catch (err: any) {
        EnterpriseLogger.error("LocalStorage write failed:", "FeeStructureEngine", { error: err?.message || err });
      }
    }
  }

  // --- ENGINE RETRIEVAL APIS ---

  public static async getCategories(schoolId: string): Promise<FeeCategory[]> {
    await this.initEngine();
    return this.categories.filter(c => c.schoolId === schoolId);
  }

  public static async getTemplates(schoolId: string): Promise<FeeTemplate[]> {
    await this.initEngine();
    return this.templates.filter(t => t.schoolId === schoolId);
  }

  public static async getAssignments(schoolId: string): Promise<FeeAssignment[]> {
    await this.initEngine();
    return this.assignments.filter(a => a.schoolId === schoolId);
  }

  public static async getRules(schoolId: string): Promise<FeeRule[]> {
    await this.initEngine();
    return this.rules.filter(r => r.schoolId === schoolId);
  }

  // --- CORE CONSTRAINTS & BUSINESS POLICY ENFORCEMENT ---

  /**
   * Create a brand new fee template.
   * Enforces rules:
   *  - Required Revenue Ledger mapping
   *  - Required Cost Center mapping
   *  - No duplicate Code in the system
   *  - No duplicate Name in the same fiscal year
   *  - Isolated by schoolId
   *  - Logged in Audit Trail
   */
  public static async createTemplate(
    schoolId: string, 
    data: Omit<FeeTemplate, 'id' | 'version'>, 
    userId: string,
    userName: string,
    userRole: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<FeeTemplate> {
    await this.initEngine();

    // 1. Validate required Revenue Ledger & Cost Center Mapping
    if (!data.mapping?.revenueAccountCode || data.mapping.revenueAccountCode.trim() === '') {
      throw new Error('قاعدة محاسبية: لا يمكن إنشاء رسم مالي بدون ربطه بحساب إيراد (Revenue Account) معتمد.');
    }
    if (!data.mapping?.costCenterId || data.mapping.costCenterId.trim() === '') {
      throw new Error('قاعدة محاسبية: لا يمكن إنشاء رسم مالي بدون تحديد مركز تكلفة (Cost Center) له.');
    }

    // 2. Prevent duplicate fee codes (global unique rule)
    const codeExists = this.templates.some(t => t.schoolId === schoolId && t.code.toLowerCase() === data.code.toLowerCase());
    if (codeExists) {
      throw new Error(`قاعدة النظام: رمز الرسم السندي (${data.code}) مكرر ومستعمل مسبقاً.`);
    }

    // 3. Prevent duplicate names within the same fiscal year
    const nameExists = this.templates.some(
      t => t.schoolId === schoolId && 
           t.fiscalYearId === data.fiscalYearId && 
           t.name.trim() === data.name.trim()
    );
    if (nameExists) {
      throw new Error(`قاعدة النظام: اسم الرسم المالي (${data.name}) مكرر بالفعل في نفس السنة المالية المحددة.`);
    }

    const newTemplate: FeeTemplate = {
      ...data,
      id: `tmpl_${Date.now()}`,
      schoolId,
      version: {
        version: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: userName,
        changeNotes: 'النسخة التأسيسية الأولى المعتمدة'
      }
    };

    this.templates.push(newTemplate);
    await this.persistData();

    // Log Audit
    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      userRole,
      'CREATE',
      'fee_templates',
      ipAddress,
      `إنشاء قالب هيكل الرسوم رقم ${newTemplate.code} - الاسم: ${newTemplate.name} برصيد إجمالي البنود: ${newTemplate.items.reduce((acc, i) => acc + i.amount, 0).toLocaleString()} د.ل`
    );

    return newTemplate;
  }

  /**
   * Update fee template.
   * ENFORCES VERSION-CONTROL & UNBREAKABLE IMMUTABILITY RULES:
   *  - Editing of already active templates with transactions is STRICTLY FORBIDDEN.
   *  - Instead, the engine creates a new major version, preserving all past historical versions.
   */
  public static async updateTemplate(
    schoolId: string,
    templateId: string,
    updatedData: Partial<Omit<FeeTemplate, 'id' | 'schoolId' | 'version'>>,
    userId: string,
    userName: string,
    userRole: string,
    ipAddress: string = '127.0.0.1',
    changeNotes: string = 'تحديث الإصدار والمعدلات المحاسبية'
  ): Promise<FeeTemplate> {
    await this.initEngine();

    const idx = this.templates.findIndex(t => t.id === templateId && t.schoolId === schoolId);
    if (idx === -1) {
      throw new Error('خطأ: لم يتم العثور على قالب الرسم المالي المطلوب.');
    }

    const original = this.templates[idx];

    // Detect specific differences for auditing
    const auditDetails: string[] = [];
    if (updatedData.recognitionPolicy && updatedData.recognitionPolicy !== original.recognitionPolicy) {
      auditDetails.push(`تغيير سياسة الاعتراف بالإيراد من (${original.recognitionPolicy || 'لا يوجد'}) إلى (${updatedData.recognitionPolicy})`);
    }
    if ((updatedData.effectiveFrom && updatedData.effectiveFrom !== original.effectiveFrom) || 
        (updatedData.effectiveTo && updatedData.effectiveTo !== original.effectiveTo)) {
      auditDetails.push(`تغيير فترة صلاحية الرسم من [${original.effectiveFrom || 'بلا'} - ${original.effectiveTo || 'بلا'}] إلى [${updatedData.effectiveFrom || original.effectiveFrom || 'بلا'} - ${updatedData.effectiveTo || original.effectiveTo || 'بلا'}]`);
    }
    if (updatedData.eligibilityRules && JSON.stringify(updatedData.eligibilityRules) !== JSON.stringify(original.eligibilityRules)) {
      auditDetails.push('تحديث وتعديل قواعد وأحكام الأهلية المرتبطة بالرسم المالي');
    }

    // Check if invoices exist for this template in FallbackStorage
    const allInvoices = FallbackStorage.getInvoices();
    const hasInvoices = allInvoices.some(inv => 
      inv.studentId && 
      this.assignments.some(asg => asg.templateId === templateId && asg.studentId === inv.studentId)
    );

    // Check if assignments exist
    const hasAssignments = this.assignments.some(asg => asg.templateId === templateId);

    if (hasInvoices || hasAssignments) {
      EnterpriseLogger.warn(`FeeTemplate ${templateId} is already in use (Invoices: ${hasInvoices}, Assignments: ${hasAssignments}). Enforcing immutability by creating a new version!`, 'FeeStructureEngine');
      
      // DECREE: Create a NEW version to preserve baseline consistency!
      const newVersionNum = original.version.version + 1;
      auditDetails.push(`إنشاء وترقية نسخة وإصدار تسلسلي جديد رقم ${newVersionNum}`);
      
      // Mark old version as superseded (non-active for new assignments)
      this.templates[idx] = {
        ...original,
        version: {
          ...original.version,
          isActive: false,
          replacedByVersion: newVersionNum
        }
      };

      // Create new template entry
      const newTmpl: FeeTemplate = {
        ...original,
        ...updatedData,
        id: `tmpl_${Date.now()}`, // New physical ID to prevent key mutation
        version: {
          version: newVersionNum,
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: userName,
          changeNotes: `نسخة تسلسلية جديدة (${newVersionNum}) بديلة للنسخة السابقة لتفادي كسر الفواتير القائمة. السبب: ${changeNotes}`
        }
      } as FeeTemplate;

      this.templates.push(newTmpl);
      await this.persistData();

      const detailsStr = auditDetails.length > 0 ? ` [التفاصيل: ${auditDetails.join(' | ')}]` : '';
      await AuditRepository.log(
        schoolId,
        userId,
        userName,
        userRole,
        'UPDATE',
        'fee_templates',
        ipAddress,
        `ترقية إصدار قالب الرسم ${original.code} من نسخة ${original.version.version} إلى نسخة ${newVersionNum} لضمان سلامة الأرشيف المالي للطلاب المسجلين.${detailsStr}`
      );

      return newTmpl;
    } else {
      // Safe to update in-place as there are absolutely zero financial footprints!
      const updatedTmpl: FeeTemplate = {
        ...original,
        ...updatedData,
        version: {
          ...original.version,
          createdAt: new Date().toISOString(),
          createdBy: userName,
          changeNotes: `تعديل القالب في وضع عدم الاستخدام الفعلي: ${changeNotes}`
        }
      } as FeeTemplate;

      this.templates[idx] = updatedTmpl;
      await this.persistData();

      const detailsStr = auditDetails.length > 0 ? ` [التعديلات المباشرة: ${auditDetails.join(' | ')}]` : '';
      await AuditRepository.log(
        schoolId,
        userId,
        userName,
        userRole,
        'UPDATE',
        'fee_templates',
        ipAddress,
        `تعديل مباشر على مسودة قالب الرسم ${original.code} (لا يملك فواتير أو ترحيلات حالية).${detailsStr}`
      );

      return updatedTmpl;
    }
  }

  /**
   * Delete fee template.
   * STRICT CONSTRAINT: Prevents deletion of templates containing assignments or invoices.
   */
  public static async deleteTemplate(
    schoolId: string,
    templateId: string,
    userId: string,
    userName: string,
    userRole: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<boolean> {
    await this.initEngine();

    const tmpl = this.templates.find(t => t.id === templateId && t.schoolId === schoolId);
    if (!tmpl) {
      throw new Error('خطأ: لم يتم العثور على قالب الرسم المالي لحذفه.');
    }

    // Validate if assigned
    const hasAssignments = this.assignments.some(asg => asg.templateId === templateId);
    if (hasAssignments) {
      throw new Error('حظر رقابي: لا يمكن حذف رسم مدرسي تم إسناده مسبقاً لطلاب نشطين.');
    }

    // Validate if invoices generated
    const allInvoices = FallbackStorage.getInvoices();
    const hasInvoices = allInvoices.some(inv => 
      this.assignments.some(asg => asg.templateId === templateId && asg.studentId === inv.studentId)
    );
    if (hasInvoices) {
      throw new Error('حظر رقابي: لا يمكن مطلقاً حذف رسم مالي مدرج في فواتير مالية قائمة بالنظام.');
    }

    this.templates = this.templates.filter(t => t.id !== templateId);
    await this.persistData();

    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      userRole,
      'DELETE',
      'fee_templates',
      ipAddress,
      `حذف كلي ونهائي لقالب الرسوم غير المستخدم رقم ${tmpl.code} - الاسم: ${tmpl.name}`
    );

    return true;
  }

  // --- BULK FEE ASSIGNMENT ENGINE ---

  /**
   * Assign fee template to students in bulk (by Stage, Grade, Section, or Individual)
   */
  public static async assignFee(
    schoolId: string,
    params: {
      templateId: string;
      targetType: 'stage' | 'grade' | 'class' | 'individual_student';
      targetValue: string; // Stage ID, Grade ID, Academic Class ID, or Student ID
      userId: string;
      userName: string;
      userRole: string;
      ipAddress?: string;
    }
  ): Promise<{ assignedCount: number }> {
    await this.initEngine();

    const tmpl = this.templates.find(t => t.id === params.templateId && t.schoolId === schoolId);
    if (!tmpl) {
      throw new Error('قالب الرسم غير موجود في قاعدة بيانات المدرسة.');
    }

    // --- ENFORCE EFFECTIVE DATING & VERSIONING ---
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Ensure template version is active
    if (!tmpl.version.isActive) {
      throw new Error('حظر صلاحية: لا يمكن إسناد نسخة غير نشطة من قالب الرسوم.');
    }

    // 2. Validate current date within validity period (Effective dating)
    if (tmpl.effectiveFrom && todayStr < tmpl.effectiveFrom) {
      throw new Error(`حظر صلاحية: قالب الرسم المالي غير صالح للتطبيق حالياً حيث يبدأ مفعوله في: ${tmpl.effectiveFrom}`);
    }
    if (tmpl.effectiveTo && todayStr > tmpl.effectiveTo) {
      throw new Error(`حظر صلاحية: لا يمكن تطبيق رسم مالي منتهي الصلاحية حيث انتهت صلاحيته في: ${tmpl.effectiveTo}`);
    }

    // 3. Block old versions if a newer active version's effectiveFrom has started
    const newerActiveTemplate = this.templates.find(t => 
      t.schoolId === schoolId && 
      t.code === tmpl.code && 
      t.version.version > tmpl.version.version && 
      t.version.isActive && 
      (!t.effectiveFrom || todayStr >= t.effectiveFrom)
    );
    if (newerActiveTemplate) {
      throw new Error(`حظر إصدار: يوجد إصدار أحدث نشط ومفعل (نسخة ${newerActiveTemplate.version.version}) لهذا الرسم المالي (${tmpl.code}). يجب استخدامه بدلاً من النسخة القديمة.`);
    }

    const students = FallbackStorage.getStudents().filter(s => s.schoolId === schoolId);
    let targetStudents: Student[] = [];

    if (params.targetType === 'individual_student') {
      targetStudents = students.filter(s => s.id === params.targetValue);
    } else if (params.targetType === 'stage') {
      targetStudents = students.filter(s => s.stageId === params.targetValue);
    } else if (params.targetType === 'grade') {
      targetStudents = students.filter(s => s.gradeId === params.targetValue);
    } else if (params.targetType === 'class') {
      targetStudents = students.filter(s => s.classId === params.targetValue || s.classroom === params.targetValue);
    }

    let assignedCount = 0;
    const siblingExclusionDetails: string[] = [];

    for (const student of targetStudents) {
      // --- DELEGATE ELIGIBILITY EVALUATION TO FEE ELIGIBILITY ENGINE ---
      const eligibility = FeeEligibilityEngine.evaluate(student, tmpl);
      
      if (eligibility.status === 'Not Eligible') {
        if (params.targetType === 'individual_student') {
          throw new Error(`فشل التحقق من الأهلية: الطالب غير مؤهل لتطبيق هذا الرسم. السبب: ${eligibility.description} (رمز: ${eligibility.reasonCode})`);
        }
        // Skip in bulk assignments
        continue;
      }

      // Prevent duplicating active assignment for the same template
      const alreadyAssigned = this.assignments.some(
        asg => asg.studentId === student.id && 
               asg.templateId === params.templateId && 
               asg.status === 'active'
      );

      if (!alreadyAssigned) {
        let customDiscountPercent = undefined;
        if (eligibility.discountAppliedPercent > 0) {
          customDiscountPercent = eligibility.discountAppliedPercent;
          siblingExclusionDetails.push(`تم تطبيق خصم بقيمة ${eligibility.discountAppliedPercent}% للطالب ${student.name} بسبب [${eligibility.description}]`);
        }

        const newAssignment: FeeAssignment = {
          id: `asg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          schoolId,
          studentId: student.id,
          templateId: tmpl.id,
          templateVersion: tmpl.version.version,
          assignedAt: new Date().toISOString(),
          assignedBy: params.userName,
          status: 'active',
          optInConfirmed: tmpl.isMandatory ? true : false, // If optional, requires explicit student opt-in
          customDiscountPercent
        };
        this.assignments.push(newAssignment);
        assignedCount++;
      }
    }

    if (assignedCount > 0) {
      await this.persistData();
      
      const detailsStr = siblingExclusionDetails.length > 0 ? ` [تفاصيل التقييم: ${siblingExclusionDetails.slice(0, 3).join(', ')}${siblingExclusionDetails.length > 3 ? '...' : ''}]` : '';
      await AuditRepository.log(
        schoolId,
        params.userId,
        params.userName,
        params.userRole,
        'CREATE',
        'fee_assignments',
        params.ipAddress || '127.0.0.1',
        `تطبيق وإسناد جماعي (Bulk Assignment) للرسم ${tmpl.name} على عدد ${assignedCount} طالب مؤهل من الفئة المستهدفة: ${params.targetType} (${params.targetValue}).${detailsStr}`
      );
    }

    return { assignedCount };
  }

  /**
   * Confirms/Opt-in to an optional fee for a specific student
   */
  public static async optInOptionalFee(
    schoolId: string,
    studentId: string,
    templateId: string,
    userId: string,
    userName: string,
    userRole: string
  ): Promise<boolean> {
    await this.initEngine();

    const asgIdx = this.assignments.findIndex(
      asg => asg.schoolId === schoolId && 
             asg.studentId === studentId && 
             asg.templateId === templateId
    );

    if (asgIdx === -1) {
      // Create a new assignment for the optional fee
      const tmpl = this.templates.find(t => t.id === templateId && t.schoolId === schoolId);
      if (!tmpl) throw new Error('الرسم الاختياري غير موجود.');

      const newAsg: FeeAssignment = {
        id: `asg_${Date.now()}`,
        schoolId,
        studentId,
        templateId,
        templateVersion: tmpl.version.version,
        assignedAt: new Date().toISOString(),
        assignedBy: userName,
        status: 'active',
        optInConfirmed: true
      };
      this.assignments.push(newAsg);
    } else {
      this.assignments[asgIdx].optInConfirmed = true;
    }

    await this.persistData();
    await AuditRepository.log(
      schoolId,
      userId,
      userName,
      userRole,
      'UPDATE',
      'fee_assignments',
      '127.0.0.1',
      `تأكيد تفعيل واشتراك الطالب بمستخلص الرسم الاختياري رقم ${templateId}.`
    );

    return true;
  }

  // --- CALCULATION ENGINE (STUDENT STRUCTURE REVENUE & RECONCILIATION) ---

  /**
   * Retrieves the comprehensive calculated active fee structure for a specific student.
   * Resolves:
   *  - Mandatory default structure
   *  - Optional opted-in structures
   *  - Family discount calculations (Sibling discount policy fallback)
   *  - Revenue account allocation & tax percentage
   */
  public static async getStudentFeeStructure(
    schoolId: string,
    studentId: string
  ): Promise<{
    student: Student;
    activeFees: {
      templateId: string;
      code: string;
      name: string;
      category: string;
      scheduleType: string;
      isMandatory: boolean;
      items: FeeItem[];
      mapping: FeeAccountMapping;
      subtotal: number;
      taxTotal: number;
      grandTotal: number;
      discountAmount: number;
      recognitionPolicy?: 'immediate' | 'cash' | 'deferred_revenue';
      deferredRevenueAccount?: string;
      revenueRecognitionMethod?: string;
      recognitionStartDate?: string;
      recognitionEndDate?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }[];
    aggregatedSubtotal: number;
    aggregatedTax: number;
    aggregatedGrandTotal: number;
  }> {
    await this.initEngine();

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;
    const mode = config.rounding.mode;

    const students = FallbackStorage.getStudents();
    const student = students.find(s => s.id === studentId && s.schoolId === schoolId);
    if (!student) {
      throw new Error('الرجاء التأكد من وجود سجل الطالب في قاعدة البيانات الموحدة.');
    }

    // A) Resolve all assignments for this student
    const studentAssignments = this.assignments.filter(
      asg => asg.studentId === studentId && 
             asg.schoolId === schoolId && 
             asg.status === 'active'
    );

    // B) Sibling policy detection (e.g. check if parentName matches other students in the same school)
    const siblingsCount = students.filter(s => 
      s.schoolId === schoolId && 
      s.id !== studentId && 
      s.parentName && 
      s.parentName === student.parentName
    ).length;

    const siblingDiscountPercent = siblingsCount > 0 ? 10 : 0; // 10% discount if sibling detected

    const activeFees: any[] = [];
    let aggregatedSubtotal = 0;
    let aggregatedTax = 0;
    let aggregatedGrandTotal = 0;

    // Compile active fees
    for (const asg of studentAssignments) {
      const tmpl = this.templates.find(t => t.id === asg.templateId && t.version.version === asg.templateVersion);
      if (!tmpl) continue;

      // --- DELEGATE ELIGIBILITY TO FEE ELIGIBILITY ENGINE ---
      const eligibility = FeeEligibilityEngine.evaluate(student, tmpl);
      if (eligibility.status === 'Not Eligible') {
        EnterpriseLogger.info(`Student ${studentId} is NOT eligible for fee template ${tmpl.name} (Reason: ${eligibility.description}). Skipping compilation.`, 'FeeStructureEngine');
        continue;
      }

      // Skip optional fee templates if not explicitly accepted
      if (!tmpl.isMandatory && !asg.optInConfirmed) continue;

      const subtotal = this.roundWithPolicy(tmpl.items.reduce((acc, itm) => acc + itm.amount, 0), precision, mode);
      
      // Calculate custom scholar / sibling discount
      const discountPercent = asg.customDiscountPercent ?? eligibility.discountAppliedPercent;
      const discountAmount = this.roundWithPolicy((subtotal * discountPercent) / 100, precision, mode);
      
      const discountedSubtotal = this.roundWithPolicy(Math.max(0, subtotal - discountAmount), precision, mode);
      const taxAmount = tmpl.mapping.taxRule.isTaxable 
        ? this.roundWithPolicy((discountedSubtotal * tmpl.mapping.taxRule.taxPercent) / 100, precision, mode)
        : 0;

      const grandTotal = this.roundWithPolicy(discountedSubtotal + taxAmount, precision, mode);

      activeFees.push({
        templateId: tmpl.id,
        code: tmpl.code,
        name: tmpl.name,
        category: tmpl.category,
        scheduleType: tmpl.scheduleType,
        isMandatory: tmpl.isMandatory,
        items: tmpl.items,
        mapping: tmpl.mapping,
        subtotal,
        taxTotal: taxAmount,
        grandTotal,
        discountAmount,
        // Include new Revenue Recognition and Effective Dating properties for downstream PostingEngine integration
        recognitionPolicy: tmpl.recognitionPolicy || 'immediate',
        deferredRevenueAccount: tmpl.deferredRevenueAccount,
        revenueRecognitionMethod: tmpl.revenueRecognitionMethod,
        recognitionStartDate: tmpl.recognitionStartDate,
        recognitionEndDate: tmpl.recognitionEndDate,
        effectiveFrom: tmpl.effectiveFrom,
        effectiveTo: tmpl.effectiveTo
      });

      aggregatedSubtotal += discountedSubtotal;
      aggregatedTax += taxAmount;
      aggregatedGrandTotal += grandTotal;
    }

    return {
      student,
      activeFees,
      aggregatedSubtotal,
      aggregatedTax,
      aggregatedGrandTotal
    };
  }

  // --- ERP AUTOMATION INTEGRATION (INVOICE GENERATION HOOK) ---

  /**
   * Evaluates a student's calculated structure and triggers double-entry invoice generation
   * into the primary general ledger and ERP student ledger automatically.
   */
  public static async generateInvoicesForStudent(
    schoolId: string,
    studentId: string,
    userId: string,
    userName: string,
    userRole: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<Invoice[]> {
    await this.initEngine();

    const structure = await this.getStudentFeeStructure(schoolId, studentId);
    if (structure.activeFees.length === 0) {
      throw new Error('لا توجد هياكل رسوم نشطة أو مستحقة لإصدار فواتير لها لهذا الطالب حالياً.');
    }

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;
    const mode = config.rounding.mode;

    const generatedInvoices: Invoice[] = [];

    for (const fee of structure.activeFees) {
      // --- ENFORCE EFFECTIVE DATING ---
      const todayStr = new Date().toISOString().split('T')[0];
      if (fee.effectiveTo && todayStr > fee.effectiveTo) {
        throw new Error(`حظر رقابي: لا يمكن إصدار فواتير لرسوم مالية منتهية الصلاحية. الرسم: ${fee.name} انتهى في ${fee.effectiveTo}.`);
      }

      // 1. Create invoice under Draft status through the InvoiceEngine (which handles validation & duplicates)
      const draftInvoiceData: Partial<Invoice> = {
        studentId: studentId,
        studentName: structure.student.name,
        amount: fee.subtotal - fee.discountAmount,
        taxAmount: fee.taxTotal,
        totalAmount: fee.grandTotal,
        remainingAmount: fee.grandTotal,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days terms
        item: `${fee.name} - السنة المالية 2026`,
        invoiceDate: new Date().toISOString().split('T')[0],
        costCenterId: fee.mapping.costCenterId,
        stageId: structure.student.stageId || 'stage_high',
        costCenter: fee.mapping.costCenterId === 'cc_high' ? 'secondary' : 'primary',
        items: fee.items.map(i => ({
          description: i.name,
          amount: this.roundWithPolicy(i.amount - (fee.discountAmount / fee.items.length), precision, mode)
        })),
        lines: fee.items.map((i, index) => ({
          id: `line_${index}_${Date.now()}`,
          description: i.name,
          quantity: 1,
          unitPrice: this.roundWithPolicy(i.amount - (fee.discountAmount / fee.items.length), precision, mode),
          amount: this.roundWithPolicy(i.amount - (fee.discountAmount / fee.items.length), precision, mode)
        })),
        financialPeriod: '2026-07',
        user: userName,
        schoolId,
        branchId: 'branch_main',
        academicYearId: '2026',
        fiscalYearId: '2026',

        // Map IFRS Revenue Recognition properties
        recognitionPolicy: fee.recognitionPolicy,
        deferredRevenueAccount: fee.deferredRevenueAccount,
        revenueRecognitionMethod: fee.revenueRecognitionMethod,
        recognitionStartDate: fee.recognitionStartDate,
        recognitionEndDate: fee.recognitionEndDate
      };

      try {
        const draftInv = await InvoiceEngine.createInvoice(schoolId, draftInvoiceData, {
          userId,
          userName,
          userRole,
          ipAddress
        });

        // 2. Approve the invoice through InvoiceEngine
        const approvedInv = await InvoiceEngine.approveInvoice(schoolId, draftInv.id, {
          userId,
          userName,
          userRole,
          ipAddress
        });

        // 3. Issue the invoice through InvoiceEngine (triggers sequence numbering, GL posting, student state increment & revenue recog schedule)
        const issuedInv = await InvoiceEngine.issueInvoice(schoolId, approvedInv.id, {
          userId,
          userName,
          userRole,
          ipAddress
        });

        generatedInvoices.push(issuedInv);
      } catch (err: any) {
        EnterpriseLogger.info(`Skipping duplicate or invalid invoice generation: ${err.message}`, 'FeeStructureEngine', { error: err });
      }
    }

    return generatedInvoices;
  }
}
