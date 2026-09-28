import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsAssessmentPanel from '../components/exams/ExamsAssessmentPanel';
import {
  AssessmentGradeProjection,
  AssessmentWorkflowState,
  createEmptyAssessmentWorkflowState
} from '../modules/exams/application/AssessmentWorkflowService';

interface AssessmentPanelHarnessProps {
  persist: (next: AssessmentWorkflowState) => Promise<boolean>;
  publishGrades: (assessmentId: string, projections: AssessmentGradeProjection[]) => Promise<boolean>;
}

function AssessmentPanelHarness({ persist, publishGrades }: AssessmentPanelHarnessProps) {
  const [state, setState] = useState(createEmptyAssessmentWorkflowState());

  return (
    <ExamsAssessmentPanel
      state={state}
      actorId="teacher-exam-test"
      candidateIds={['student-exam-test-1']}
      subjects={[{ id: 'subject-exam-test-1', name: 'مادة اختبار 1', maxScore: 100 }]}
      permissionRole="admin"
      onChange={async next => {
        const saved = await persist(next);
        if (saved) setState(next);
        return saved;
      }}
      onPublishGrades={publishGrades}
    />
  );
}

afterEach(() => cleanup());

describe('ExamsAssessmentPanel UI workflow', () => {
  it('runs the electronic exam from question draft through verified grade projection using memory only', async () => {
    const persist = vi.fn(async (_next: AssessmentWorkflowState) => true);
    const publishGrades = vi.fn(async (_assessmentId: string, _projections: AssessmentGradeProjection[]) => true);
    const { container } = render(<AssessmentPanelHarness persist={persist} publishGrades={publishGrades} />);

    const clickAndWaitForWrite = async (name: string) => {
      const previousWriteCount = persist.mock.calls.length;
      const button = screen.getAllByRole('button', { name }).find(candidate => !(candidate as HTMLButtonElement).disabled);
      expect(button).toBeDefined();
      fireEvent.click(button!);
      await waitFor(() => expect(persist).toHaveBeenCalledTimes(previousWriteCount + 1));
    };

    fireEvent.change(screen.getByPlaceholderText('نص السؤال'), { target: { value: 'كم يساوي 2 + 2؟' } });
    fireEvent.change(screen.getByPlaceholderText('معرف المادة'), { target: { value: 'subject-exam-test-1' } });
    fireEvent.change(screen.getByPlaceholderText('معرف الصف'), { target: { value: 'class-exam-test-1' } });
    fireEvent.change(screen.getByPlaceholderText('الخيار الأول'), { target: { value: '4' } });
    fireEvent.change(screen.getByPlaceholderText('الخيار الثاني'), { target: { value: '5' } });
    await clickAndWaitForWrite('حفظ السؤال كمسودة');
    expect(await screen.findByText('كم يساوي 2 + 2؟')).toBeTruthy();

    await clickAndWaitForWrite('تعديل مسودة');
    expect(await screen.findByText('كم يساوي 2 + 2؟ (مراجعة)')).toBeTruthy();
    await clickAndWaitForWrite('نسخ إصدار');
    await waitFor(() => expect(container.textContent).toContain('@v2'));
    const archiveButtons = screen.getAllByRole('button', { name: 'أرشفة' });
    expect(archiveButtons).toHaveLength(2);
    const writesBeforeArchive = persist.mock.calls.length;
    fireEvent.click(archiveButtons[1]);
    await waitFor(() => expect(persist).toHaveBeenCalledTimes(writesBeforeArchive + 1));
    expect(await screen.findByText('مؤرشف')).toBeTruthy();

    await clickAndWaitForWrite('تفعيل');
    const questionCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(questionCheckbox);
    expect(questionCheckbox.checked).toBe(true);
    const assessmentSubjectSelect = Array.from(container.querySelectorAll('select')).find(select =>
      Array.from(select.options).some(option => option.textContent === 'مادة الترحيل بعد النشر')
    );
    expect(assessmentSubjectSelect).toBeDefined();
    fireEvent.change(assessmentSubjectSelect!, { target: { value: 'subject-exam-test-1' } });
    expect((screen.getByRole('button', { name: 'إنشاء النموذج' }) as HTMLButtonElement).disabled).toBe(false);
    await clickAndWaitForWrite('إنشاء النموذج');

    for (const lifecycleLabel of ['مراجعة', 'معتمد', 'مجدول', 'مفتوح']) {
      await clickAndWaitForWrite(lifecycleLabel);
    }

    fireEvent.change(screen.getByPlaceholderText('معرف الطالب الرسمي'), { target: { value: 'student-not-in-cycle' } });
    const writesBeforeRejectedCandidate = persist.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'بدء محاولة' }));
    expect(await screen.findByText(/الطالب غير موجود ضمن السجلات الأكاديمية المؤهلة/)).toBeTruthy();
    expect(persist).toHaveBeenCalledTimes(writesBeforeRejectedCandidate);

    fireEvent.change(screen.getByPlaceholderText('معرف الطالب الرسمي'), { target: { value: 'student-exam-test-1' } });
    await clickAndWaitForWrite('بدء محاولة');
    const answerSelect = container.querySelectorAll('select').item(container.querySelectorAll('select').length - 1);
    fireEvent.change(answerSelect, { target: { value: 'option-1' } });
    await clickAndWaitForWrite('حفظ الإجابة');
    await clickAndWaitForWrite('تسليم المحاولة');

    await clickAndWaitForWrite('مغلق');
    await clickAndWaitForWrite('قيد التصحيح');
    await clickAndWaitForWrite('تصحيح آلي');
    await clickAndWaitForWrite('إنهاء التصحيح');
    expect(await screen.findByText('نتيجة نهائية: 1 من 1')).toBeTruthy();
    await clickAndWaitForWrite('نتائج معتمدة');
    await clickAndWaitForWrite('منشور');

    fireEvent.click(screen.getByRole('button', { name: 'ترحيل للنتيجة العامة' }));
    await waitFor(() => expect(publishGrades).toHaveBeenCalledTimes(1));
    expect(publishGrades).toHaveBeenCalledWith(
      expect.any(String),
      [expect.objectContaining({
        subjectId: 'subject-exam-test-1',
        candidateId: 'student-exam-test-1',
        score: 100,
        subjectMaximum: 100,
        assessmentScore: 1,
        assessmentMaximum: 1
      })]
    );
    expect(await screen.findByText(/تم ترحيل 1 نتيجة إلى مادة مادة اختبار 1/)).toBeTruthy();
  });
});
