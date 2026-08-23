import { StudentMedicalRecordRepository } from '../repositories/StudentMedicalRecordRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';

export class StudentMedicalService {
  /**
   * Enlists the creation of a Student Medical Record profile.
   */
  public static enlistCreateMedicalRecord(
    studentId: string,
    medicalId: string,
    studentData: any
  ): void {
    const medicalRecord = {
      id: medicalId,
      studentId,
      bloodType: studentData.healthBloodType || '',
      chronicDiseases: studentData.healthChronic || '',
      allergies: studentData.healthAllergies || '',
      vaccinesTaken: studentData.healthVaccines,
      emergencyContactName: studentData.parentName || '',
      emergencyContactPhone: studentData.parentPhone || '',
      medicalNotes: ''
    };
    StudentMedicalRecordRepository.enlistCreateStudentMedicalRecord(studentId, medicalId, medicalRecord);
  }

  /**
   * Enlists the deletion of a student's medical record.
   */
  public static enlistDeleteMedicalRecord(studentId: string): void {
    FallbackStorage.assertCanonicalPersistence('student medical record deletion lookup');
    const med = FallbackStorage.getStudentMedicalRecords().find(m => m.studentId === studentId);
    if (med) {
      StudentMedicalRecordRepository.enlistDeleteStudentMedicalRecord(med.id);
    }
  }
}
