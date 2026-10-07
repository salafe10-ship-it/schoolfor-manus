import type { AcademicClass, CostCenter, Grade, Stage, Student } from '../types';

export type StudentFeeConfig = { id?: string; type: string; amount: number };

export const isStudentTuitionFee = (value: unknown) => {
  const text = normalize(value);
  return (text.includes('رسوم') || text.includes('قسط')) && text.includes('دراسي') || text.includes('tuition');
};

export interface StudentFeeContext {
  stageId: string;
  stageType: 'kindergarten' | 'primary' | 'middle' | 'secondary';
  costCenter: string;
  gradeOrder?: number;
  gradeText: string;
}

const STAGE_ALIASES: Record<StudentFeeContext['stageType'], string[]> = {
  kindergarten: ['kindergarten', 'روضة', 'رياض الاطفال', 'تمهيدي', 'تمهيدى'],
  primary: ['primary', 'ابتدائي', 'ابتدائية', 'ابتدائ'],
  middle: ['middle', 'متوسط', 'متوسطة', 'إعدادي', 'اعدادي', 'اعدادية'],
  secondary: ['secondary', 'ثانوي', 'ثانوى', 'ثانوية', 'ثانويه']
};

const normalize = (value: unknown) => String(value || '')
  .toLowerCase()
  .replace(/[\u064B-\u065F\u0670]/g, '')
  .replace(/[أإآ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/[ـ_\-–—]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stageTypeFrom = (value: unknown): StudentFeeContext['stageType'] | undefined => {
  const text = normalize(value);
  const match = Object.entries(STAGE_ALIASES).find(([, aliases]) => aliases.some(alias => text.includes(normalize(alias))));
  return match?.[0] as StudentFeeContext['stageType'] | undefined;
};

const gradeOrdinal = (value: unknown): number | undefined => {
  const text = normalize(value);
  const ordinals: Array<[number, string[]]> = [
    [11, ['الحادي عشر', 'الحادية عشر', 'الحادية عشرة', 'eleventh']],
    [12, ['الثاني عشر', 'الثانية عشر', 'الثانية عشرة', 'twelfth']],
    [1, ['الاول', 'اولي', 'اولى', 'first']],
    [2, ['الثاني', 'الثانيه', 'ثاني', 'second']],
    [3, ['الثالث', 'الثالثه', 'ثالث', 'third']],
    [4, ['الرابع', 'الرابعه', 'رابع', 'fourth']],
    [5, ['الخامس', 'الخامسه', 'خامس', 'fifth']],
    [6, ['السادس', 'السادسه', 'سادس', 'sixth']],
    [7, ['السابع', 'السابعة', 'سابع', 'seventh']],
    [8, ['الثامن', 'الثامنه', 'ثامن', 'eighth']],
    [9, ['التاسع', 'التاسعه', 'تاسع', 'ninth']],
    [10, ['العاشر', 'العاشره', 'عاشر', 'tenth']]
  ];
  return ordinals.find(([, aliases]) => aliases.some(alias => text.includes(normalize(alias))))?.[0];
};

export function resolveStudentFeeContext(
  student: Student,
  stages: Stage[] = [],
  grades: Grade[] = [],
  academicClasses: AcademicClass[] = [],
  costCenters: CostCenter[] = []
): StudentFeeContext | null {
  const classroom = String(student.classroom || '').trim();
  const grade = grades.find(item => item.id === student.gradeId)
    || grades.find(item => item.name.trim() === classroom)
    || grades.find(item => item.id === academicClasses.find(row => row.id === student.classId)?.gradeId);
  const stage = stages.find(item => item.id === student.stageId)
    || stages.find(item => item.id === grade?.stageId)
    || stages.find(item => [item.id, item.code, item.type, item.costCenterId, item.name]
      .some(value => normalize(value) === normalize(student.costCenterId)));
  const profileCenter = normalize(student.costCenterId).replace(/^cc /, '');
  const centerRecord = costCenters.find(item => [item.id, item.code]
    .some(value => normalize(value) === normalize(student.costCenterId)))
    || costCenters.find(item => item.stageId && item.stageId === (stage?.id || grade?.stageId));
  const stageType = stageTypeFrom(stage?.type || stage?.name || stage?.costCenterId)
    || stageTypeFrom(centerRecord?.code || centerRecord?.name)
    || stageTypeFrom(profileCenter)
    || stageTypeFrom(`${grade?.name || ''} ${classroom} ${student.educationLevel || ''}`);
  if (!stageType) return null;

  const canonicalCenter = stage?.costCenterId
    || centerRecord?.code
    || centerRecord?.id
    || (['kindergarten', 'primary', 'middle', 'secondary'].includes(profileCenter) ? profileCenter : stageType);
  return {
    stageId: stage?.id || grade?.stageId || student.stageId || '',
    stageType,
    costCenter: String(canonicalCenter || '').trim(),
    gradeOrder: Number.isFinite(Number(grade?.order)) && Number(grade?.order) > 0 ? Number(grade?.order) : gradeOrdinal(`${grade?.name || ''} ${classroom}`),
    gradeText: `${grade?.name || ''} ${classroom}`.trim()
  };
}

export function feeConfigMatchesStudent(config: StudentFeeConfig, context: StudentFeeContext): boolean {
  const type = normalize(config.type);
  const isTuition = isStudentTuitionFee(type);
  if (!isTuition) return true;

  const configStage = stageTypeFrom(type);
  if (configStage && configStage !== context.stageType) return false;
  // A configured tuition item must identify its stage to avoid offering a
  // generic tuition fee that can silently bypass the student's stage tariff.
  if (!configStage) return false;

  const rangeConnector = [' الى ', ' الي ', ' حتى ', ' حتي ', ' to ', ' through '].some(token => ` ${type} `.includes(token));
  const ordinalAliases = [
    [11, ['الحادي عشر', 'الحادي عشر']], [12, ['الثاني عشر']],
    [1, ['الاول', 'اولي', 'اولى', 'first']], [2, ['الثاني', 'ثاني', 'second']],
    [3, ['الثالث', 'ثالث', 'third']], [4, ['الرابع', 'رابع', 'fourth']],
    [5, ['الخامس', 'خامس', 'fifth']], [6, ['السادس', 'سادس', 'sixth']],
    [7, ['السابع', 'سابع', 'seventh']], [8, ['الثامن', 'ثامن', 'eighth']],
    [9, ['التاسع', 'تاسع', 'ninth']], [10, ['العاشر', 'عاشر', 'tenth']]
  ] as const;
  const namedGrades: number[] = [...new Set<number>(ordinalAliases
    .filter(([, aliases]) => aliases.some(alias => type.includes(normalize(alias))))
    .map(([number]) => Number(number)))];
  const targetGrade = context.gradeOrder || gradeOrdinal(context.gradeText);
  if (namedGrades.length && !targetGrade) return false;
  if (namedGrades.length && targetGrade) {
    const lower = Math.min(...namedGrades);
    const upper = Math.max(...namedGrades);
    return rangeConnector && namedGrades.length > 1
      ? targetGrade >= lower && targetGrade <= upper
      : namedGrades.includes(targetGrade);
  }
  return true;
}
