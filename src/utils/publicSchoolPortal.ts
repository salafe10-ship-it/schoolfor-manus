export type PublicSchoolPortal = { id: string; name: string };

export async function loadPublicSchoolPortal(context: string): Promise<PublicSchoolPortal | null> {
  const response = await fetch(`/api/public/school-portal?school=${encodeURIComponent(context)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('SCHOOL_PORTAL_UNAVAILABLE');
  const payload = await response.json();
  const school = payload?.school;
  if (payload?.success !== true || typeof school?.id !== 'string' || typeof school?.name !== 'string') {
    throw new Error('INVALID_SCHOOL_PORTAL');
  }
  return { id: school.id, name: school.name };
}
