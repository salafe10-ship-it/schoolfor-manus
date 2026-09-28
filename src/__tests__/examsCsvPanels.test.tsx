import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExamsCertificatesPanel from '../components/exams/ExamsCertificatesPanel';
import ExamsDistributionPanel from '../components/exams/ExamsDistributionPanel';

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
  vi.restoreAllMocks();
});

describe('exam CSV screen exports', () => {
  it('protects distribution exports from normalized formula markers after control characters', async () => {
    const hostileName = '\u00A0\t＝HYPERLINK("https://bad.example")';
    const captured: Blob[] = [];
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        captured.push(blob);
        return 'blob:distribution-test';
      }
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      render(
        <ExamsDistributionPanel
          schoolName="مدرسة اختبار"
          students={[{
            id: 'student-csv-test',
            name: hostileName,
            classroom: 'صف الاختبار',
            section: 'أ',
            nationalId: 'national-test',
            seatNumber: 'seat-1',
            hallId: 'hall-csv-test'
          }]}
          halls={[{ id: 'hall-csv-test', name: 'قاعة اختبار 1', capacity: 20 }]}
          approved={false}
          syncing={false}
          onAutoDistribute={vi.fn(async () => {})}
          onPersistStudents={vi.fn(async () => true)}
          notify={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'تصدير CSV' }));
      expect(captured).toHaveLength(1);
      expect(await readBlob(captured[0])).toContain(`"'${hostileName.replaceAll('"', '""')}"`);
    } finally {
      if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
      else Reflect.deleteProperty(URL, 'createObjectURL');
      if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
      else Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });

  it('protects the official transcript CSV from a formula hidden after spaces and tabs', async () => {
    const hostileName = ' \t=HYPERLINK("https://bad.example")';
    const captured: Blob[] = [];
    const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: (blob: Blob) => {
        captured.push(blob);
        return 'blob:transcript-test';
      }
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      render(
        <ExamsCertificatesPanel
          schoolName="مدرسة اختبار"
          settings={{ academicYear: 'عام اختبار', semester: 'فصل اختبار' }}
          students={[{ id: 'student-transcript-test', name: hostileName, classroom: 'صف اختبار', section: 'أ' }]}
          subjects={[{ id: 'subject-transcript-test', name: 'مادة اختبار 1', maxScore: 100, passScore: 50 }]}
          gradesMatrix={{ 'student-transcript-test': { 'subject-transcript-test': 80 } }}
          approvalStatus={{ approved: true, approvedBy: 'مدير الاختبار', approvedAt: '2026-09-27' }}
          closures={[{
            isImmutableArchive: true,
            archiveId: 'archive-transcript-test',
            signatureHash: 'a'.repeat(64),
            approvedBy: 'مدير الاختبار',
            serverSignedAt: '2026-09-27'
          }]}
          classes={[]}
          notify={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'تصدير كشف الدرجات CSV' }));
      expect(captured).toHaveLength(1);
      expect(await readBlob(captured[0])).toContain(`"'${hostileName.replaceAll('"', '""')}"`);
    } finally {
      if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
      else Reflect.deleteProperty(URL, 'createObjectURL');
      if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
      else Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  });
});
