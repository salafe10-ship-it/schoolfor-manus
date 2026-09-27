import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const moduleSource = readFileSync(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'), 'utf8');
const assessmentSource = readFileSync(resolve(process.cwd(), 'src/components/exams/ExamsAssessmentPanel.tsx'), 'utf8');

describe('exam print output safety', () => {
  it('escapes report title, school, and every student result field before writing HTML', () => {
    const start = moduleSource.indexOf('const handlePrintReport =');
    const end = moduleSource.indexOf('const handlePrintGuidePDF =', start);
    const report = moduleSource.slice(start, end);

    expect(report).toContain('const schoolName = escapeHtml(selectedSchool?.name ||');
    expect(report).toContain('const reportTitle = escapeHtml(title);');
    for (const field of ['seatNumber', 'name', 'classroom', 'totalEarned', 'totalMax', 'percentage', 'gradeSymbol', 'status']) {
      expect(report).toContain(`escapeHtml(st.${field})`);
    }
    expect(report).not.toContain('${st.name}');
    expect(report).not.toContain('${title}');
    expect(report).not.toContain('مجمع المدارس النموذجية الأهلية');
  });

  it('escapes hall, proctor, schedule-print title, and electronic-assessment metadata', () => {
    expect(moduleSource).toContain('<td>${escapeHtml(h.name)}</td>');
    expect(moduleSource).toContain('<td>${escapeHtml(h.location)}</td>');
    expect(moduleSource).toContain('<td>${escapeHtml(pa.name)}</td>');
    expect(moduleSource).toContain('<td>${escapeHtml(pa.shift)}</td>');

    const printElementStart = moduleSource.indexOf('const handlePrintElementByID =');
    const printElementEnd = moduleSource.indexOf('const handlePrintScheduleReport =', printElementStart);
    expect(moduleSource.slice(printElementStart, printElementEnd)).toContain('<title>${escapeHtml(title)}</title>');

    expect(assessmentSource).toContain('${escapeHtml(assessment.durationMinutes)}');
    expect(assessmentSource).toContain('${escapeHtml(blueprint?.totalPoints || 0)}');
  });
});
