import { StudentUniformAccountRepository } from '../repositories/StudentUniformAccountRepository';
import { StudentTransportationRepository } from '../repositories/StudentTransportationRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';

export class StudentFeeService {
  /**
   * Enlists the creation of a Uniform Account.
   */
  public static enlistCreateUniformAccount(
    studentId: string,
    uniformId: string
  ): void {
    const uniformAccount = {
      id: uniformId,
      studentId,
      uniformSize: 'M',
      piecesReceivedCount: 0,
      totalFees: 150.00,
      paymentStatus: 'unpaid'
    };
    StudentUniformAccountRepository.enlistCreateStudentUniformAccount(studentId, uniformId, uniformAccount);
  }

  /**
   * Enlists the creation of a Student Transportation Profile.
   */
  public static enlistCreateTransportationProfile(
    studentId: string,
    transportId: string
  ): void {
    const transportProfile = {
      id: transportId,
      studentId,
      routeNumber: 'Route 10',
      pickupPoint: 'الموقع الافتراضي الرئيسي',
      dropoffPoint: 'بوابة المدرسة رقم 1',
      monthlyFees: 0.00,
      status: 'inactive'
    };
    StudentTransportationRepository.enlistCreateStudentTransportation(studentId, transportId, transportProfile);
  }

  /**
   * Enlists the creation of an Initial Admission / Registration Fee Invoice.
   */
  public static enlistCreateInitialInvoice(
    schoolId: string,
    studentId: string,
    studentName: string,
    invoiceId: string
  ): void {
    const invoice = {
      id: invoiceId,
      schoolId,
      studentId,
      studentName,
      amount: 1500.00,
      paidAmount: 0.00,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'unpaid',
      category: 'tuition',
      notes: 'رسوم الالتحاق والتسجيل السنوية للدورة الأكاديمية الجديدة'
    };
    InvoiceRepository.enlistCreateInvoice(
      invoiceId,
      schoolId,
      studentId,
      studentName,
      1500.00,
      'رسوم الالتحاق والتسجيل السنوية للدورة الأكاديمية الجديدة',
      'tuition',
      invoice
    );
  }

  /**
   * Checks if student has any outstanding financial, transport, asset, or uniform commitments.
   */
  public static checkFinancialAndLogisticalCommitments(
    studentId: string,
    feesRemaining: number,
    reasons: string[]
  ): void {
    // 1. Outstanding general fees
    if (feesRemaining > 0) {
      reasons.push(`قيود مالية: يوجد على الطالب ذمم مالية معلقة بقيمة ${feesRemaining} ريال سعودي.`);
    }

    // 2. Unpaid invoices
    const invoices = FallbackStorage.getInvoices().filter(i => i.studentId === studentId && i.status !== 'paid');
    if (invoices.length > 0) {
      reasons.push(`قيود الفواتير: يوجد للطالب ${invoices.length} فواتير دراسية مستحقة غير مسددة.`);
    }

    // 3. Assets custody
    const assets = FallbackStorage.getStudentAssets().filter(a => a.studentId === studentId && !a.returnedDate);
    if (assets.length > 0) {
      reasons.push(`عهدة الأجهزة والمعدات: الطالب مستلم حالياً لأجهزة عهدة مدرسية (${assets.map(a => a.assetName).join(', ')}) لم تسلم للقسم التقني.`);
    }

    // 4. Transport status
    const transport = FallbackStorage.getStudentTransportation().find(t => t.studentId === studentId && t.status === 'active');
    if (transport) {
      reasons.push(`النقل المدرسي: الطالب مسجل بمسار نقل مدرسي نشط (${transport.routeNumber})، يجب إلغاء اشتراكه بالنقل أولاً.`);
    }

    // 5. Uniform status
    const uniforms = FallbackStorage.getStudentUniformAccounts().find(u => u.studentId === studentId && u.paymentStatus === 'unpaid');
    if (uniforms) {
      reasons.push(`الزي المدرسي: يوجد رسوم مستحقة غير مدفوعة على زي الطالب المدرسي.`);
    }
  }

  /**
   * Enlists the deletion of a student's uniform and transportation profiles.
   */
  public static enlistDeleteUniformAndTransportation(studentId: string): void {
    const uni = FallbackStorage.getStudentUniformAccounts().find(u => u.studentId === studentId);
    if (uni) {
      StudentUniformAccountRepository.enlistDeleteStudentUniformAccount(uni.id);
    }

    const tr = FallbackStorage.getStudentTransportation().find(t => t.studentId === studentId);
    if (tr) {
      StudentTransportationRepository.enlistDeleteStudentTransportation(tr.id);
    }
  }
}
