import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Project, SyntaxKind } from 'ts-morph';

const examComponentFiles = [
  'src/components/ExamsResultsModule.tsx',
  'src/components/exams/ExamsAssessmentPanel.tsx',
  'src/components/exams/ExamsCertificatesPanel.tsx',
  'src/components/exams/ExamsDistributionPanel.tsx'
];

describe('exams button wiring', () => {
  it('blocks automatic proctor assignment after either exam lock and does not promise an unsent notification', () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const source = project.addSourceFileAtPath(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'));
    const autoAssignButton = [
      ...source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    ].find(element => element.getAttributes().some(attribute =>
      attribute.isKind(SyntaxKind.JsxAttribute)
      && attribute.getNameNode().getText() === 'onClick'
      && attribute.getInitializer()?.getText().includes('handleAutoAssignProctors')
    ));
    const disabled = autoAssignButton?.getAttributes().find(attribute =>
      attribute.isKind(SyntaxKind.JsxAttribute) && attribute.getNameNode().getText() === 'disabled'
    );

    expect(disabled?.isKind(SyntaxKind.JsxAttribute) ? disabled.getInitializer()?.getText() : '').toContain('canAutoAssignExamProctors');
    expect(source.getFullText()).toContain('if (!canAutoAssignExamProctors(scheduleApprovalStatus.approved, approvalStatus.approved))');
    expect(source.getFullText()).toContain('لا يرسل هذا الإجراء إشعارات للمعلمين.');
  });

  it.each(examComponentFiles)('%s has no inert native button', filePath => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const source = project.addSourceFileAtPath(resolve(process.cwd(), filePath));
    const buttons = [
      ...source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    ].filter(element => element.getTagNameNode().getText() === 'button');

    const inertButtons = buttons.filter(button => {
      const attributes = button.getAttributes();
      const hasOnClick = attributes.some(attribute =>
        attribute.isKind(SyntaxKind.JsxAttribute) && attribute.getNameNode().getText() === 'onClick'
      );
      const isSubmit = attributes.some(attribute =>
        attribute.isKind(SyntaxKind.JsxAttribute)
        && attribute.getNameNode().getText() === 'type'
        && attribute.getInitializer()?.getText().replace(/["']/g, '') === 'submit'
      );
      return !hasOnClick && !isSubmit;
    });

    expect(inertButtons.map(button => button.getStartLineNumber())).toEqual([]);
  });

  it('persists scheduled-exam deletion before updating the visible schedule', () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const source = project.addSourceFileAtPath(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'));
    const deleteButton = [
      ...source.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...source.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    ].find(element => element.getAttributes().some(attribute =>
      attribute.isKind(SyntaxKind.JsxAttribute)
      && attribute.getNameNode().getText() === 'title'
      && attribute.getInitializer()?.getText().replace(/["']/g, '') === 'حذف فترة الاختبار'
    ));

    expect(deleteButton).toBeDefined();
    const onClick = deleteButton?.getAttributes().find(attribute =>
      attribute.isKind(SyntaxKind.JsxAttribute) && attribute.getNameNode().getText() === 'onClick'
    );
    const handler = onClick?.isKind(SyntaxKind.JsxAttribute) ? onClick.getInitializer()?.getText() || '' : '';

    expect(handler).toContain('await saveToServerDb');
    expect(handler.indexOf('await saveToServerDb')).toBeLessThan(handler.indexOf('setSchedule(filtered)'));
  });

  it.each(examComponentFiles)('%s routes exam print actions through the isolated print frame', filePath => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const source = project.addSourceFileAtPath(resolve(process.cwd(), filePath));
    const sourceText = source.getFullText();

    expect(sourceText).toContain('createExamPrintDocument');
    expect(sourceText).not.toContain("window.open('', '_blank')");
  });

  it('escapes untrusted record values interpolated into exam print markup', () => {
    const project = new Project({ skipAddingFilesFromTsConfig: true });
    const source = project.addSourceFileAtPath(resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'));
    const printMarkup = source.getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter(call => /\.document\.write$/.test(call.getExpression().getText()))
      .map(call => call.getArguments()[0]?.getText() || '')
      .join('\n');

    const unescapedRecordValues = [
      '${title}', '${st.seatNumber}', '${st.name}', '${st.classroom}', '${st.totalEarned}',
      '${st.totalMax}', '${st.percentage}', '${st.gradeSymbol}', '${st.status}',
      '${h.name}', '${h.capacity}', '${h.location}', '${pa.name}', '${pa.shift}',
      '${closure.totalStudents}', '${closure.passRate}', '${closure.passedCount}',
      '${closure.failedCount}', '${sub.maxScore}', '${sub.passScore}', '${m.percentage}'
    ];
    for (const interpolation of unescapedRecordValues) {
      expect(printMarkup, `print markup contains raw interpolation ${interpolation}`).not.toContain(interpolation);
    }
  });
});
