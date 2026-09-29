import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsAssessmentPanel from '../components/exams/ExamsAssessmentPanel';
import {
  AssessmentWorkflowState,
  createAssessment,
  createEmptyAssessmentWorkflowState,
  createQuestionDraft,
  setQuestionStatus
} from '../modules/exams/application/AssessmentWorkflowService';

const actorId = 'teacher-export-test';
const subjectId = 'subject-export-test';
const questionPrompt = '=HYPERLINK("https://evil.example","<img src=x onerror=alert(1)>")';
const assessmentTitle = '=1+1';

function createExportFixture(): AssessmentWorkflowState {
  let state = createEmptyAssessmentWorkflowState();
  state = createQuestionDraft(state, {
    id: 'question-export-test',
    bankId: 'bank-export-test',
    ownerId: actorId,
    type: 'single',
    prompt: questionPrompt,
    points: 1,
    classification: {
      subjectId,
      gradeId: 'grade-export-test',
      standardId: 'standard-export-test',
      bloomLevel: 'understand',
      dokLevel: 2,
      difficulty: 'easy',
      language: 'ar'
    },
    configuration: {
      options: [{ id: 'option-1', label: 'الإجابة الأولى' }, { id: 'option-2', label: 'الإجابة الثانية' }],
      correctOptionIds: ['option-1']
    }
  }, actorId);
  state = setQuestionStatus(state, 'question-export-test', 1, 'active', actorId);
  state = createAssessment(state, {
    id: 'assessment-export-test',
    title: assessmentTitle,
    durationMinutes: 30,
    actorId,
    subjectId,
    questionRefs: [{ questionId: 'question-export-test', version: 1 }]
  });
  return state;
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read exported blob'));
    reader.readAsText(blob);
  });
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('ExamsAssessmentPanel exports', () => {
  it('downloads formula-safe CSV and XLSX and sends escaped report markup to the print frame', async () => {
    const state = createExportFixture();
    const capturedBlobs: Blob[] = [];
    const downloadedNames: string[] = [];
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlobs.push(blob);
      return `blob:assessment-export-${capturedBlobs.length}`;
    });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedNames.push(this.download);
    });

    const print = vi.fn();
    const focus = vi.fn();
    const printWindow = { print, focus, addEventListener: vi.fn() } as unknown as Window;
    vi.spyOn(HTMLIFrameElement.prototype, 'contentWindow', 'get').mockReturnValue(printWindow);

    try {
      render(
        <ExamsAssessmentPanel
          state={state}
          actorId={actorId}
          candidateIds={[]}
          subjects={[{ id: subjectId, name: 'مادة اختبار 1', maxScore: 100 }]}
          permissionRole="admin"
          onChange={async () => true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: `تصدير CSV للامتحان ${assessmentTitle}` }));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      const csv = await readBlob(capturedBlobs[0]);
      expect(capturedBlobs[0].type).toContain('text/csv');
      expect(downloadedNames[0]).toBe('نتائج_الامتحان_assessment-export-test.csv');
      expect(csv).toContain(`"'=1+1"`);
      expect(csv).toContain(`"'=HYPERLINK(""https://evil.example"",""<img src=x onerror=alert(1)>"")"`);

      fireEvent.click(screen.getByRole('button', { name: `تصدير XLSX للامتحان ${assessmentTitle}` }));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(2), { timeout: 20_000 });
      await screen.findByText('تم تنزيل ملف XLSX للامتحان والأسئلة ونتائج الطلاب.', {}, { timeout: 20_000 });
      expect(createObjectURL).toHaveBeenCalledTimes(2);
      expect(capturedBlobs[1].type).toContain('spreadsheetml.sheet');
      expect(downloadedNames[1]).toBe('نتائج_الامتحان_assessment-export-test.xlsx');
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await capturedBlobs[1].arrayBuffer());
      expect(workbook.getWorksheet('الامتحان')?.getCell('B2').value).toBe(`'${assessmentTitle}`);
      expect(workbook.getWorksheet('الأسئلة')?.getCell('C2').value).toBe(`'${questionPrompt}`);

      fireEvent.click(screen.getByRole('button', { name: `طباعة أو حفظ PDF للامتحان ${assessmentTitle}` }));
      const printFrame = document.querySelector('iframe[data-exam-print-frame]') as HTMLIFrameElement | null;
      expect(printFrame).not.toBeNull();
      const printDocument = new DOMParser().parseFromString(printFrame?.srcdoc || '', 'text/html');
      expect(printDocument.querySelector('script, img[onerror]')).toBeNull();
      expect(printDocument.body.textContent).toContain('onerror=alert(1)');
      printFrame?.dispatchEvent(new Event('load'));
      await screen.findByText('تم تجهيز تقرير RTL؛ اختر الطباعة أو الحفظ بصيغة PDF.');
      expect(focus).toHaveBeenCalledOnce();
      expect(print).toHaveBeenCalledOnce();
    } finally {
      if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
      else Reflect.deleteProperty(URL, 'createObjectURL');
      if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
      else Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  }, 60_000);
});
