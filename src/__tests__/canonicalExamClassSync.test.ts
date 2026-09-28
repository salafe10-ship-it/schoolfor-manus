import { describe, expect, it } from 'vitest';
import {
  buildCanonicalExamClassReferenceIndex,
  buildCanonicalExamClassesFromAcademicStructure,
  reconcileExamDatabaseClassReferences
} from '../modules/exams/application/CanonicalExamClassSyncService';

describe('canonical exam class synchronization', () => {
  it('preserves the exact Student Affairs class references, capacities, sections, and stages', () => {
    const classes = buildCanonicalExamClassesFromAcademicStructure({
      sections: ['أ', 'ب'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true },
        { id: 'primary-1', code: 'PRI1-B', name: 'أولى ابتدائي ب', capacity: 25, isActive: true },
        { id: 'middle-1', code: 'MID1-A', name: 'أولى متوسط أ', capacity: 30, isActive: true },
        { id: 'high-1', code: 'HIGH1-A', name: 'أولى ثانوي علمي أ', capacity: 35, isActive: true },
        { id: 'inactive', code: 'PRI9-A', name: 'صف غير نشط', capacity: 20, isActive: false }
      ]
    });

    expect(classes).toEqual(expect.arrayContaining([
      { id: 'kg-1', name: 'بستان أ', level: 'kindergarten', capacity: 20, sections: ['أ'] },
      { id: 'primary-1', name: 'أولى ابتدائي ب', level: 'primary', capacity: 25, sections: ['ب'] },
      { id: 'middle-1', name: 'أولى متوسط أ', level: 'middle', capacity: 30, sections: ['أ'] },
      { id: 'high-1', name: 'أولى ثانوي علمي أ', level: 'high', capacity: 35, sections: ['أ'] }
    ]));
    expect(classes).toHaveLength(4);
  });

  it('fails closed when the academic structure has an unsupported class code', () => {
    expect(() => buildCanonicalExamClassesFromAcademicStructure({
      sections: ['أ'],
      classes: [{ id: 'unknown', code: 'OTHER-A', name: 'صف غير مصنف', capacity: 20, isActive: true }]
    })).toThrow('لا يحدد مرحلة أكاديمية مدعومة');
  });

  it('resolves enrollment references by canonical id, code, or display name', () => {
    const structure = {
      sections: ['أ'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true }
      ]
    };
    const index = buildCanonicalExamClassReferenceIndex(structure);

    expect(index.byReference.get('kg-1')?.name).toBe('بستان أ');
    expect(index.byReference.get('kg1-a')?.name).toBe('بستان أ');
    expect(index.byReference.get('بستان أ')?.name).toBe('بستان أ');
  });

  it('repairs stale exam class snapshots without dropping legacy records', () => {
    const database: Record<string, any> = {
      exams_students_enriched: [
        { id: 'student-1', name: 'طالب موثق', classroom: 'kg-1', status: 'active' }
      ],
      exams_schedule: [
        { id: 'schedule-1', classroom: 'KG1-A', subjectId: 'subject-1' }
      ],
      exams_classes_list: [
        { id: 'legacy-class', name: 'صف محفوظ سابقاً', capacity: 18 }
      ]
    };
    const structure = {
      sections: ['أ'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true }
      ]
    };

    reconcileExamDatabaseClassReferences(database, structure, ['KG1-A']);

    expect(database.exams_students_enriched[0].classroom).toBe('بستان أ');
    expect(database.exams_schedule[0].classroom).toBe('بستان أ');
    expect(database.exams_classes_list).toEqual(expect.arrayContaining([
      { id: 'legacy-class', name: 'صف محفوظ سابقاً', capacity: 18 },
      { id: 'kg-1', name: 'بستان أ', level: 'kindergarten', capacity: 20, sections: ['أ'] }
    ]));
  });

  it('fails closed when an active canonical enrollment points to no academic class', () => {
    const database: Record<string, any> = {
      exams_students_enriched: [],
      exams_schedule: [],
      exams_classes_list: []
    };

    expect(() => reconcileExamDatabaseClassReferences(database, {
      sections: ['أ'],
      classes: [
        { id: 'kg-1', code: 'KG1-A', name: 'بستان أ', capacity: 20, isActive: true }
      ]
    }, ['class-id-missing-from-structure'])).toThrow(/إحالات صفوف طلاب نشطة غير موجودة/);
  });
});
