const SECTION_FEATURES: Record<string, string> = {
  academic: 'students',
  students: 'students',
  admissions: 'students',
  parents: 'students',
  attendance: 'students',
  exams: 'exams',
  library: 'library',
  teachers: 'teachers',
  accounts: 'accounts',
  treasury: 'accounts',
  financial_reports: 'accounts',
  student_accounts: 'student_accounts',
  inventory: 'inventory',
  procurement: 'inventory',
  fixed_assets: 'inventory',
  school_transport: 'buses',
  school_uniform: 'uniform_management',
  school_users_admin: 'school_users_admin',
};

/** Missing flags remain enabled for backward-compatible customer releases. */
export function isSectionFeatureEnabled(sectionId: string, features: Record<string, boolean> | undefined): boolean {
  const featureKey = SECTION_FEATURES[sectionId];
  return !featureKey || features?.[featureKey] !== false;
}

export { SECTION_FEATURES };
