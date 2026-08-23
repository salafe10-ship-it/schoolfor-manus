import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'),
  'utf8',
);

describe('exams governance evidence safety', () => {
  it('does not seed closures, re-evaluation decisions, or audit history', () => {
    expect(source).toContain('const [controlClosures, setControlClosures] = useState<any[]>(() => {\n    return [];');
    expect(source).toContain('const [reEvaluationRequests, setReEvaluationRequests] = useState<any[]>(() => {\n    return [];');
    expect(source).not.toContain('CLS-1447-01');
    expect(source).not.toContain('REV-2026-001');
    expect(source).not.toContain("id: 'a-1'");
  });
});
