import { StudentLibraryAccountRepository } from '../repositories/StudentLibraryAccountRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';

export class StudentLibraryService {
  /**
   * Enlists the creation of a Student Library Account.
   */
  public static enlistCreateLibraryAccount(
    studentId: string,
    libraryId: string
  ): void {
    const libraryAccount = {
      id: libraryId,
      studentId,
      libraryCardNumber: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'active',
      booksBorrowedCount: 0,
      unpaidFines: 0.00
    };
    StudentLibraryAccountRepository.enlistCreateStudentLibraryAccount(studentId, libraryId, libraryAccount);
  }

  /**
   * Validates if a student has any active library commitments (borrowed books or unpaid fines).
   */
  public static checkLibraryCommitments(studentId: string, reasons: string[]): void {
    const libAccount = FallbackStorage.getStudentLibraryAccounts().find(l => l.studentId === studentId);
    if (libAccount) {
      if (libAccount.booksBorrowedCount > 0) {
        reasons.push(`عهدة المكتبة: الطالب يستعير حالياً ${libAccount.booksBorrowedCount} كتب مدرسية لم يتم إرجاعها.`);
      }
      if (libAccount.unpaidFines > 0) {
        reasons.push(`غرامات المكتبة: يوجد غرامات تأخير مكتبية غير مسددة بقيمة ${libAccount.unpaidFines} ريال.`);
      }
    }
  }

  /**
   * Enlists the deletion of a student's library account.
   */
  public static enlistDeleteLibraryAccount(studentId: string): void {
    const lib = FallbackStorage.getStudentLibraryAccounts().find(l => l.studentId === studentId);
    if (lib) {
      StudentLibraryAccountRepository.enlistDeleteStudentLibraryAccount(lib.id);
    }
  }
}
