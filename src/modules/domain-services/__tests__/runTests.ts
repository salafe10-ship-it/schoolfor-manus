import { StudentAdmissionDomainService } from '../StudentAdmissionDomainService';
import { RevenueRecognitionDomainService } from '../RevenueRecognitionDomainService';
import { FinancialClosingDomainService } from '../FinancialClosingDomainService';
import { FallbackStorage } from '../../../database/repositories/FallbackStorage';
import { FinancialConfigurationRepository } from '../../../database/repositories/FinancialConfigurationRepository';
import { RevenueRecognitionRepository } from '../../../database/repositories/RevenueRecognitionRepository';

async function runAllTests() {
  console.log('\n=========================================');
  console.log('   ENTERPRISE DOMAIN SERVICE TEST SUITE   ');
  console.log('=========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Set up mock data or state needed by services
  const schoolId = 'school_test_1';
  const meta = {
    userId: 'user_admin_1',
    userName: 'الأستاذ أحمد',
    userRole: 'admin',
    ipAddress: '127.0.0.1'
  };

  // Ensure config exists
  try {
    await FinancialConfigurationRepository.getBySchoolId(schoolId);
  } catch {
    await FinancialConfigurationRepository.updateConfiguration(
      schoolId,
      {
        rounding: { precision: 2, mode: 'HalfUp' },
        revenueRecognition: { deferredRevenueAccount: 'acc_211', earnedRevenueAccount: 'acc_411', defaultMethod: 'monthly_straight_line' },
        collections: { autoAllocate: true, defaultStrategy: 'fifo' }
      } as any,
      'user_admin_1',
      'الأستاذ أحمد',
      'Test setup config'
    );
  }

  // --- UNIT & NEGATIVE TESTS: StudentAdmissionDomainService ---
  console.log('\n--- MODULE 1: StudentAdmissionDomainService ---');
  
  // Test 1: Negative - Admit Student with missing name
  try {
    await StudentAdmissionDomainService.AdmitStudent(schoolId, { nationalId: '12345' }, meta);
    assert(false, 'Should throw an error if student name is missing');
  } catch (err: any) {
    assert(err.message.includes('لا يمكن قبول طالب دون تسجيل الاسم الكامل'), 'Threw correct error for missing name');
  }

  // Test 2: Negative - Admit Student with missing nationalId
  try {
    await StudentAdmissionDomainService.AdmitStudent(schoolId, { name: 'طالب تجريبي' }, meta);
    assert(false, 'Should throw an error if student nationalId is missing');
  } catch (err: any) {
    assert(err.message.includes('الهوية الوطنية أو الإقامة شرط إلزامي'), 'Threw correct error for missing nationalId');
  }

  // Test 3: Positive - Admit Student successful
  let admittedStudent: any = null;
  try {
    admittedStudent = await StudentAdmissionDomainService.AdmitStudent(schoolId, {
      name: 'ريان العتيبي',
      nationalId: '1092837465',
      parentName: 'عبدالرحمن العتيبي',
      parentPhone: '0501234567'
    }, meta);
    assert(admittedStudent && admittedStudent.studentId, 'Successfully admitted new student ryyan');
  } catch (err: any) {
    assert(false, `Should successfully admit student, but failed: ${err.message}`);
  }

  // Test 4: Positive - Register Student to class
  if (admittedStudent) {
    try {
      const regResult = await StudentAdmissionDomainService.RegisterStudent(schoolId, admittedStudent.studentId, 'class_2', meta);
      assert(regResult.success && regResult.classId === 'class_2', 'Successfully registered Ryyan to class_2');
    } catch (err: any) {
      assert(false, `Should successfully register student, but failed: ${err.message}`);
    }
  }

  // Test 5: Positive - Promote Student to new grade
  if (admittedStudent) {
    try {
      const promResult = await StudentAdmissionDomainService.PromoteStudent(schoolId, admittedStudent.studentId, 'grade_2', meta);
      assert(promResult.success && promResult.newGradeId === 'grade_2', 'Successfully promoted Ryyan to grade_2');
    } catch (err: any) {
      assert(false, `Should successfully promote student, but failed: ${err.message}`);
    }
  }

  // Test 6: Negative - Transfer Student to same school
  if (admittedStudent) {
    try {
      await StudentAdmissionDomainService.TransferStudent(schoolId, admittedStudent.studentId, schoolId, meta);
      assert(false, 'Should fail to transfer student to the same school');
    } catch (err: any) {
      assert(err.message.includes('لا يمكن نقل الطالب إلى نفس المدرسة الحالية'), 'Threw correct error for self-transfer');
    }
  }

  // Test 7: Positive - Transfer Student to another school
  if (admittedStudent) {
    try {
      const transferResult = await StudentAdmissionDomainService.TransferStudent(schoolId, admittedStudent.studentId, 'school_test_2', meta);
      assert(transferResult.success && transferResult.targetSchoolId === 'school_test_2', 'Successfully transferred Ryyan to school_test_2');
    } catch (err: any) {
      assert(false, `Should transfer student, but failed: ${err.message}`);
    }
  }


  // --- UNIT & NEGATIVE TESTS: RevenueRecognitionDomainService ---
  console.log('\n--- MODULE 2: RevenueRecognitionDomainService ---');

  // Set up a mock period in repository
  const periodId = 'period_test_1';
  await RevenueRecognitionRepository.savePeriod({
    id: periodId,
    schoolId,
    name: 'الفصل الأول 1447',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    isClosed: false,
    accountingPeriodId: 'acc_period_1'
  } as any);

  // Test 8: Negative - Recognize revenue with missing period ID
  try {
    await RevenueRecognitionDomainService.RecognizeRevenue(schoolId, '', 'user_admin_1');
    assert(false, 'Should fail to recognize revenue with empty periodId');
  } catch (err: any) {
    assert(err.message.includes('لا يمكن تنفيذ عملية الاعتراف بالإيرادات دون تحديد الفترة الأكاديمية'), 'Threw correct error for missing period ID');
  }

  // Test 9: Positive - Recognize revenue successfully
  try {
    const recResult = await RevenueRecognitionDomainService.RecognizeRevenue(schoolId, periodId, 'user_admin_1');
    assert(recResult.success && recResult.periodId === periodId, 'Successfully completed revenue recognition run');
  } catch (err: any) {
    assert(false, `Should recognize revenue, but failed: ${err.message}`);
  }


  // --- UNIT & NEGATIVE TESTS: FinancialClosingDomainService ---
  console.log('\n--- MODULE 3: FinancialClosingDomainService ---');

  // Test 10: Negative - Generate fees with missing student ID
  try {
    await FinancialClosingDomainService.GenerateStudentFees(schoolId, '', 'user_admin_1', 'الأستاذ أحمد', 'admin');
    assert(false, 'Should fail to generate fees for empty studentId');
  } catch (err: any) {
    assert(err.message.includes('لا يمكن توليد الرسوم دون تحديد الطالب'), 'Threw correct error for empty student ID');
  }

  // Test 11: Negative - Close accounting period with missing period ID
  try {
    await FinancialClosingDomainService.CloseAccountingPeriod(schoolId, '', 'user_admin_1');
    assert(false, 'Should fail to close with empty periodId');
  } catch (err: any) {
    assert(err.message.includes('لا يمكن إغلاق الفترة المالية دون تحديد معرف الفترة'), 'Threw correct error for empty period ID');
  }

  console.log('\n=========================================');
  console.log(`  TEST RESULTS: PASSED: ${passed}, FAILED: ${failed}`);
  console.log('=========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
