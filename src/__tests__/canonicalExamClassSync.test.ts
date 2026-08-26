import { describe, expect, it } from 'vitest';
import { buildCanonicalExamClassesFromAcademicStructure } from '../modules/exams/application/CanonicalExamClassSyncService';

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
});
