/**
 * Student Affairs Service Layer & Business Rules
 * Implements the Business Rules and Application Service layers, validating operations
 * before forwarding them to the Repository layer.
 */

import { StudentRepository } from '../repository/StudentRepository';
import { Student } from '../../../types';
import { StudentAffairsValidationFramework } from '../../../validation/StudentAffairsValidationFramework';
import { BusinessRuleError } from '../../../utils/errors';

export const StudentAffairsService = {
  /**
   * Application Service: Save Student Workflow
   * Performs validation & business rule validations before committing to the repository
   */
  async saveStudent(
    formStudent: any,
    students: Student[],
    isNewRecord: boolean,
    newOrUpdatedStudent: Student
  ): Promise<any> {
    // ========================================================================
    // CENTRALIZED VALIDATION & BUSINESS RULES FRAMEWORK
    // ========================================================================
    StudentAffairsValidationFramework.validateStudentSave(
      formStudent,
      students,
      isNewRecord,
      isNewRecord ? undefined : newOrUpdatedStudent.id
    );

    // ========================================================================
    // REPOSITORY CALL (Repository Layer)
    // ========================================================================
    return await StudentRepository.saveStudent(newOrUpdatedStudent);
  },

  /**
   * Application Service: Soft Delete Student Workflow
   * Performs soft deletion business checks before committing
   */
  async softDeleteStudent(currentStudent: Student, selectedStudentId: string, data: any): Promise<any> {
    // ========================================================================
    // CENTRALIZED VALIDATION & BUSINESS RULES FRAMEWORK
    // ========================================================================
    StudentAffairsValidationFramework.validateRequired(selectedStudentId, 'معرف الطالب لتعطيل القيد');
    StudentAffairsValidationFramework.validateDeletionSafety(currentStudent, data);

    // ========================================================================
    // REPOSITORY CALL (Repository Layer)
    // ========================================================================
    return await StudentRepository.softDeleteStudent(selectedStudentId);
  },

  /**
   * Application Service: Bulk Create Students
   */
  async bulkCreateStudents(studentsList: any[]): Promise<any> {
    return await StudentRepository.bulkCreateStudents(studentsList);
  },

  /**
   * Application Service: Transfer Student Workflow
   */
  async transferStudent(studentId: string, payload: { classroom: string; section: string; stageId?: string; branchId?: string }): Promise<any> {
    StudentAffairsValidationFramework.validateRequired(payload.classroom, 'الصف الدراسي المستهدف');
    StudentAffairsValidationFramework.validateRequired(payload.section, 'الشعبة المستهدفة');
    return await StudentRepository.transferStudent(studentId, payload);
  },

  /**
   * Application Service: Promote Student Workflow
   */
  async promoteStudent(studentId: string, payload: { targetClassroom: string; targetStageId: string; carryOverFees: number }): Promise<any> {
    StudentAffairsValidationFramework.validateRequired(payload.targetClassroom, 'الصف المستهدف لترقية الطالب');
    StudentAffairsValidationFramework.validateRequired(payload.targetStageId, 'المرحلة المستهدفة لترقية الطالب');
    StudentAffairsValidationFramework.validateType(payload.carryOverFees, 'number', 'الرسوم المرحّلة');
    StudentAffairsValidationFramework.validateLimit(payload.carryOverFees, 0, 100000, 'الرسوم المرحّلة');
    return await StudentRepository.promoteStudent(studentId, payload);
  },

  /**
   * Application Service: Re-Enroll Student Workflow
   */
  async reEnrollStudent(studentId: string, payload: { classroom: string; section: string }): Promise<any> {
    StudentAffairsValidationFramework.validateRequired(payload.classroom, 'الصف الدراسي لإعادة القيد');
    StudentAffairsValidationFramework.validateRequired(payload.section, 'الشعبة لإعادة القيد');
    return await StudentRepository.reEnrollStudent(studentId, payload);
  },

  /**
   * Application Service: Graduate Student Workflow
   */
  async graduateStudent(studentId: string): Promise<any> {
    return await StudentRepository.graduateStudent(studentId);
  },

  /**
   * Application Service: Archive Student Workflow
   */
  async archiveStudent(studentId: string, archive: boolean): Promise<any> {
    return await StudentRepository.archiveStudent(studentId, archive);
  },

  /**
   * Application Service: Dismiss Student Workflow
   */
  async dismissStudent(
    studentId: string, 
    payload: { type: 'temporary' | 'permanent'; reason: string; decisionNumber: string; authority: string; date: string }
  ): Promise<any> {
    StudentAffairsValidationFramework.validateRequired(payload.decisionNumber, 'رقم قرار التأديب');
    StudentAffairsValidationFramework.validateRequired(payload.reason, 'سبب الفصل التأديبي');
    StudentAffairsValidationFramework.validateRequired(payload.type, 'نوع الفصل التأديبي');
    return await StudentRepository.dismissStudent(studentId, payload);
  },

  /**
   * Application Service: Restore Student Workflow
   */
  async restoreStudent(studentId: string): Promise<any> {
    return await StudentRepository.restoreStudent(studentId);
  },

  /**
   * Application Service: Permanent Delete Student Workflow (Disabled)
   */
  async permanentDeleteStudent(studentId: string): Promise<any> {
    throw new BusinessRuleError('لا يسمح بالحذف النهائي للبيانات. يرجى استخدام خاصية التعطيل (Soft Delete) للحفاظ على سلامة السجلات.');
  },
};
