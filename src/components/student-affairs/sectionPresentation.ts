export const MODERN_FAMILY_SCHOOL_ID = 'be687819-4d8d-427f-8479-81c0b70c35e1';

export type SectionPresentationOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function sectionPresentationOptions(values: string[], modernFamily: boolean): SectionPresentationOption[] {
  const uniqueValues = Array.from(new Set(values.map(value => String(value || '').trim()).filter(Boolean)));
  const visibleValues = modernFamily ? uniqueValues.slice(0, 4) : uniqueValues;
  return visibleValues.map((value, index) => ({
    value,
    label: modernFamily ? String(index + 1) : `شعبة ${value}`
  }));
}

export function sectionTermForSchool(schoolId: string, modernFamilyLabel = 'الفصل', defaultLabel = 'الشعبة'): string {
  return schoolId === MODERN_FAMILY_SCHOOL_ID ? modernFamilyLabel : defaultLabel;
}
