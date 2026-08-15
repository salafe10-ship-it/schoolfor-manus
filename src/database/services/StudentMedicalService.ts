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
      bloodType: studentData.healthBloodType || 'O+',
      chronicDiseases: studentData.healthChronic || 'لا يوجد',
      allergies: studentData.healthAllergies || 'لا يوجد',
      vaccinesTaken: studentData.healthVaccines !== undefined ? studentData.healthVaccines : true,
      emergencyContactName: studentData.parentName || 'جهة اتصال الطوارئ',
      emergencyContactPhone: studentData.parentPhone || '000000000',
      medicalNotes: 'سجل طبي سليم ومؤهل صحياً'
    };
    StudentMedicalRecordRepository.enlistCreateStudentMedicalRecord(studentId, medicalId, medicalRecord);
  }

  /**
   * Enlists the deletion of a student's medical record.
   */
  public static enlistDeleteMedicalRecord(studentId: string): void {
    const med = FallbackStorage.getStudentMedicalRecords().find(m => m.studentId === studentId);
    if (med) {
      StudentMedicalRecordRepository.enlistDeleteStudentMedicalRecord(med.id);
    }
  }
}
