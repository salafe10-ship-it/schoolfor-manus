import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Project, SyntaxKind } from 'ts-morph';

const examComponentFiles = [
  'src/components/ExamsResultsModule.tsx',
  'src/components/exams/ExamsCertificatesPanel.tsx',
  'src/components/exams/ExamsDistributionPanel.tsx'
];

describe('exams button wiring', () => {
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
});
