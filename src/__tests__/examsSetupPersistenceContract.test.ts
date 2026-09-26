import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('exams setup persistence contract', () => {
  it('waits for central persistence before confirming setup mutations', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    expect(source).toContain('تعذر حفظ إعدادات الامتحانات في المصدر المركزي');
    expect(source).toContain('تعذر حفظ المادة الجديدة في المصدر المركزي');
    expect(source).toContain('تعذر حفظ الصف الجديد في المصدر المركزي');
  });

  it('persists preparation edits and never creates placeholder halls', () => {
    const source = readFileSync('src/components/ExamsResultsModule.tsx', 'utf8');
    const subjectsStart = source.indexOf("{prepActiveCategory === 'subjects' && (");
    const hallsStart = source.indexOf("{prepActiveCategory === 'halls' && (");
    const proctorsStart = source.indexOf("{prepActiveCategory === 'proctors' && (");
    const subjectsPanel = source.slice(subjectsStart, hallsStart);
    const hallsPanel = source.slice(hallsStart, proctorsStart);

    expect(source).toContain('const persistPreparationSubjects = async');
    expect(source).toContain('const persistPreparationHalls = async');
    expect(subjectsPanel).toContain('persistPreparationSubjects(subjects)');
    expect(subjectsPanel).toContain('await persistPreparationSubjects(updated)');
    expect(subjectsPanel).toContain('إضافة مادة المنهج الفعلي');
    expect(hallsPanel).toContain("onClick={() => setActiveTab('halls')}");
    expect(hallsPanel).toContain('persistPreparationHalls(halls)');
    expect(hallsPanel).toContain('await persistPreparationHalls(updated)');
    expect(hallsPanel).not.toContain('لجنة قاعة جديدة ${halls.length + 1}');
    expect(hallsPanel).not.toContain("location: 'مبنى الامتحانات الرئيسي'");
  });
});
