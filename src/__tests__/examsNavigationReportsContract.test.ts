import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');

describe('exams navigation and schedule report contracts', () => {
  it('orders the sidebar by the operational lifecycle and keeps the guide last', () => {
    const start = source.indexOf('const sidebarMenu = [');
    const end = source.indexOf('];', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const menuIds = Array.from(source.slice(start, end).matchAll(/\{ id: '([^']+)'/g), match => match[1]);
    expect(menuIds).toEqual([
      'control-center',
      'settings',
      'classes',
      'halls',
      'distribution',
      'seating',
      'proctors',
      'schedule',
      'grades-entry',
      'processing',
      'quality-governance',
      'review',
      'reports',
      'certificates',
      'system-settings',
      'exams-guide'
    ]);
  });

  it('renders and wires the concise guide with accessible navigation state', () => {
    expect(source).toContain("activeTab === 'exams-guide'");
    expect(source).toContain('id="exams-guide-title"');
    expect(source).toContain('onClick={handlePrintGuidePDF}');
    expect(source).toContain('aria-label="طباعة دليل تشغيل الامتحانات أو حفظه بصيغة PDF"');
    expect(source).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(source).toContain('aria-label={`فتح ${item.label}`}');
  });

  it('renders data-backed section and hall reports with explicit empty states', () => {
    expect(source).toContain("selectedClassReport === 'section'");
    expect(source).toContain("selectedClassReport === 'hall'");
    expect(source).toContain('لا يوجد جدول مستقل محفوظ لهذه الشعبة');
    expect(source).toContain('لا توجد اختبارات محفوظة للصف المرتبط بهذه الشعبة.');
    expect(source).toContain('يعرض الاختبارات المرتبطة فعلياً بمعرف القاعة المختارة في الجدول المحفوظ.');
    expect(source).toContain('لا توجد فترات امتحان محفوظة لهذه القاعة.');
    expect(source).toContain('aria-label="اختر الشعبة لتقرير جدول الامتحانات"');
    expect(source).toContain('aria-label="اختر القاعة لتقرير الانشغال"');
  });
});
