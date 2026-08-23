/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../../types';
import { FeeTemplate } from './FeeStructureEngine';
import { FallbackStorage } from '../repositories/FallbackStorage';

// --- ENTERPRISE ELIGIBILITY SCHEMAS ---

export interface EligibilityRules {
  schoolId?: string;
  branchId?: string;
  stageId?: string;
  gradeId?: string;
  classId?: string;
  classroom?: string;
  section?: string;
  program?: string;
  nationality?: string; // e.g. "SA" or "سعودي"
  registrationType?: string; // e.g. "new", "returning"
  allowedStatuses?: string[]; // e.g. ["active", "suspended"]
  minEnrollmentDate?: string; // YYYY-MM-DD
  maxEnrollmentDate?: string; // YYYY-MM-DD
  requiresScholarship?: boolean;
  requiresExemption?: boolean;
  requiresSiblings?: boolean;
  minAge?: number;
  maxAge?: number;
  customRules?: CustomRule[];
}

export interface CustomRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
  value: any;
}

export interface EligibilityResult {
  status: 'Eligible' | 'Not Eligible' | 'Partial Eligibility';
  reasonCode: string;
  description: string;
  eligibleAmountPercent: number; // 0 to 100
  discountAppliedPercent: number; // 0 to 100
}

export class FeeEligibilityEngine {
  /**
   * Evaluates if a student is eligible for a given fee template.
   * Completely decoupled from any UI and cleanly handles rule evaluation.
   */
  public static evaluate(
    student: Student,
    template: FeeTemplate,
    customRulesOverload?: EligibilityRules
  ): EligibilityResult {
    FallbackStorage.assertCanonicalPersistence('fee eligibility sibling lookup');
    // 1. Resolve active eligibility rules from the template mapping or custom overrides
    const rules: EligibilityRules = customRulesOverload || (template as any).eligibilityRules || {};

    // Base Default Result (Fully Eligible)
    let status: 'Eligible' | 'Not Eligible' | 'Partial Eligibility' = 'Eligible';
    let reasonCode = 'ELIG_DEFAULT_PASS';
    let description = 'الطالب مطابقة له كافة المعايير والضوابط التأسيسية للرسم.';
    let eligibleAmountPercent = 100;
    let discountAppliedPercent = 0;

    // A) Base Sanity Status Validation - If withdrawn/dismissed/inactive, student is ineligible by default unless overridden
    const inactiveStatuses = ['withdrawn', 'dismissed', 'inactive'];
    if (inactiveStatuses.includes(student.status) && !rules.allowedStatuses?.includes(student.status)) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_STATUS_TERMINATED',
        description: `الطالب غير مؤهل بسبب حالته الأكاديمية غير النشطة (${student.status}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // B) School ID Check
    if (rules.schoolId && student.schoolId !== rules.schoolId) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_SCHOOL_MISMATCH',
        description: `الرسم مخصص لمدرسة أخرى (مطلوب: ${rules.schoolId}، الحالي: ${student.schoolId}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // C) Branch ID Check
    if (rules.branchId && student.branchId !== rules.branchId) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_BRANCH_MISMATCH',
        description: `الرسم مخصص لفرع آخر (مطلوب: ${rules.branchId}، الحالي: ${student.branchId}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // D) Stage Matching
    if (rules.stageId && student.stageId !== rules.stageId) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_STAGE_MISMATCH',
        description: `المرحلة الدراسية للطالب لا تتطابق مع مرحلة الرسم المحددة.`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // E) Grade Matching
    if (rules.gradeId && student.gradeId !== rules.gradeId) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_GRADE_MISMATCH',
        description: `الصف الدراسي للطالب لا يتطابق مع الصف المستهدف للرسم.`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // F) Class / Section / Classroom Matching
    if (rules.classId && student.classId !== rules.classId) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_CLASS_MISMATCH',
        description: `الشعبة/الفصل الدراسي للطالب غير متطابق.`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }
    if (rules.classroom && student.classroom !== rules.classroom) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_CLASSROOM_MISMATCH',
        description: `الفصل الدراسي للطالب غير متطابق مع مستهدف الرسم (المطلوب: ${rules.classroom}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }
    if (rules.section && student.section !== rules.section) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_SECTION_MISMATCH',
        description: `الشعبة الدراسية للطالب غير متطابقة مع مستهدف الرسم (المطلوب: ${rules.section}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // G) Program Matching
    if (rules.program && student.academicId !== rules.program && student.educationLevel !== rules.program) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_PROGRAM_MISMATCH',
        description: `البرنامج التعليمي للطالب لا يتطابق مع شروط الرسم.`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // H) Nationality Verification
    if (rules.nationality && student.nationality && student.nationality.toLowerCase() !== rules.nationality.toLowerCase()) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_NATIONALITY_MISMATCH',
        description: `الرسم مخصص لجنسية محددة فقط (مطلوب: ${rules.nationality}).`,
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // I) Enrollment Date (Effective registration date range)
    if (rules.minEnrollmentDate && student.registrationDate) {
      if (new Date(student.registrationDate) < new Date(rules.minEnrollmentDate)) {
        return {
          status: 'Not Eligible',
          reasonCode: 'NOT_ELIG_ENROLL_DATE_EARLY',
          description: `تاريخ التحاق الطالب (${student.registrationDate}) يسبق بداية نافذة الأهلية للرسم.`,
          eligibleAmountPercent: 0,
          discountAppliedPercent: 0
        };
      }
    }
    if (rules.maxEnrollmentDate && student.registrationDate) {
      if (new Date(student.registrationDate) > new Date(rules.maxEnrollmentDate)) {
        return {
          status: 'Not Eligible',
          reasonCode: 'NOT_ELIG_ENROLL_DATE_LATE',
          description: `تاريخ التحاق الطالب (${student.registrationDate}) يتجاوز نهاية نافذة الأهلية للرسم.`,
          eligibleAmountPercent: 0,
          discountAppliedPercent: 0
        };
      }
    }

    // J) Sibling Discount Policy Evaluation (خصم الإخوة)
    const studentsList = FallbackStorage.getStudents();
    const siblingCount = student.parentName
      ? studentsList.filter(s => s.schoolId === student.schoolId && s.id !== student.id && s.parentName && s.parentName.trim() === student.parentName.trim()).length
      : 0;

    if (rules.requiresSiblings && siblingCount === 0) {
      return {
        status: 'Not Eligible',
        reasonCode: 'NOT_ELIG_NO_SIBLINGS',
        description: 'الرسم مخصص حصرياً للطلاب الذين لديهم إخوة مسجلين بالمدرسة.',
        eligibleAmountPercent: 0,
        discountAppliedPercent: 0
      };
    }

    // If sibling detected and template specifies tuition, apply a 10% standard discount automatically
    if (siblingCount > 0 && template.category === 'Tuition') {
      status = 'Partial Eligibility';
      reasonCode = 'ELIG_SIBLING_DISCOUNT';
      description = `تم تفعيل خصم الإخوة بنسبة 10% لوجود عدد ${siblingCount} إخوة مسجلين بنفس العائلة.`;
      discountAppliedPercent = 10;
      eligibleAmountPercent = 90;
    }

    // K) Age Range Verification (الفئة العمرية)
    if (student.birthDate && (rules.minAge !== undefined || rules.maxAge !== undefined)) {
      const birth = new Date(student.birthDate);
      const ageDiffMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDiffMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

      if (rules.minAge !== undefined && age < rules.minAge) {
        return {
          status: 'Not Eligible',
          reasonCode: 'NOT_ELIG_AGE_TOO_YOUNG',
          description: `عمر الطالب (${age} سنة) أصغر من السن الأدنى المسموح به للرسم وهو ${rules.minAge} سنة.`,
          eligibleAmountPercent: 0,
          discountAppliedPercent: 0
        };
      }
      if (rules.maxAge !== undefined && age > rules.maxAge) {
        return {
          status: 'Not Eligible',
          reasonCode: 'NOT_ELIG_AGE_TOO_OLD',
          description: `عمر الطالب (${age} سنة) يتجاوز السن الأقصى المسموح به للرسم وهو ${rules.maxAge} سنة.`,
          eligibleAmountPercent: 0,
          discountAppliedPercent: 0
        };
      }
    }

    // L) Scholarship & Exemption (المنح والإعفاءات الدراسية)
    // Check if the student has high behavior points (e.g. merit scholarship threshold)
    if (student.behaviorPoints && student.behaviorPoints >= 90) {
      status = 'Partial Eligibility';
      reasonCode = 'ELIG_MERIT_SCHOLARSHIP';
      description = 'تم منح الطالب خصم منحة التفوق والتميز السلوكي بنسبة 15%.';
      discountAppliedPercent = Math.max(discountAppliedPercent, 15);
      eligibleAmountPercent = 100 - discountAppliedPercent;
    }

    // M) Custom Rule-Based Evaluation (قواعد المستقبل المرنة)
    if (rules.customRules && rules.customRules.length > 0) {
      for (const rule of rules.customRules) {
        const studentValue = (student as any)[rule.field];
        let rulePassed = false;

        switch (rule.operator) {
          case 'eq':
            rulePassed = studentValue === rule.value;
            break;
          case 'neq':
            rulePassed = studentValue !== rule.value;
            break;
          case 'gt':
            rulePassed = Number(studentValue) > Number(rule.value);
            break;
          case 'lt':
            rulePassed = Number(studentValue) < Number(rule.value);
            break;
          case 'contains':
            rulePassed = String(studentValue).toLowerCase().includes(String(rule.value).toLowerCase());
            break;
          case 'in':
            rulePassed = Array.isArray(rule.value) && rule.value.includes(studentValue);
            break;
        }

        if (!rulePassed) {
          return {
            status: 'Not Eligible',
            reasonCode: `NOT_ELIG_CUSTOM_RULE_${rule.field.toUpperCase()}`,
            description: `فشل التحقق من قاعدة أهلية مخصصة للمجال: ${rule.field}.`,
            eligibleAmountPercent: 0,
            discountAppliedPercent: 0
          };
        }
      }
    }

    return {
      status,
      reasonCode,
      description,
      eligibleAmountPercent,
      discountAppliedPercent
    };
  }
}
