import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('student additional information integrity', () => {
  it('does not reintroduce medical or behavior defaults in the UI', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/student-affairs/StudentAdditionalInformation.tsx'),
      'utf8'
    );
    expect(source).toContain("healthBloodType || ''");
    expect(source).toContain('behaviorPoints ?? 0');
    expect(source).not.toContain("healthBloodType || 'O+'");
    expect(source).not.toContain('behaviorPoints || 100');
    expect(source).not.toContain("behaviorDisciplineLevel || 'ممتاز'");
  });
});
