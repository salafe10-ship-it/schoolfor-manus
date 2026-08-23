import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('exam data integrity', () => {
  it('uses central students and starts grades empty', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'),
      'utf8'
    );
    expect(source).toContain('return initialStudents.map');
    expect(source).toContain('return {};');
    expect(source).not.toContain('return INITIAL_GRADES_MOCK;');
  });

  it('does not seed halls, subjects, classes, schedule, or proctor assignments', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ExamsResultsModule.tsx'),
      'utf8'
    );
    expect(source).toContain('const [halls, setHalls] = useState<any[]>(() => {\n    return [];');
    expect(source).toContain('const [subjects, setSubjects] = useState<any[]>(() => {\n    return [];');
    expect(source).toContain('return initialClasses;');
    expect(source).toContain('const [schedule, setSchedule] = useState<any[]>(() => {\n    return [];');
    expect(source).toContain('const [proctorAssignments, setProctorAssignments] = useState<any[]>(() => {\n    return [];');
  });
});
