const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * A persisted session may be restored from a school URL only when that URL
 * names the exact school already proven by the server-derived identity.
 */
export function canRestoreSchoolPortalSession(schoolContext: string, trustedSchoolId: string | undefined): boolean {
  const context = String(schoolContext || '').trim();
  const schoolId = String(trustedSchoolId || '').trim();
  return UUID_PATTERN.test(context) && context.toLowerCase() === schoolId.toLowerCase();
}
