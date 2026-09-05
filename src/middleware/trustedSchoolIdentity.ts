import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-resolved presentation data for the trusted school scope.
 * The id is always the authenticated school UUID; this object never accepts
 * a client-selected school identifier.
 */
export type TrustedSchoolPresentation = {
  id: string;
  name: string;
  logo: string;
  type: 'government' | 'private' | 'international' | 'model';
  licenseNumber: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  status: 'active' | 'frozen';
  /** Server-derived customer UX profile; no central metadata is exposed. */
  portalProfile: 'standard' | 'customer_production';
  /** Safe, boolean-only feature flags for this school; no control-plane data. */
  features?: Record<string, boolean>;
  connectedDb?: string;
};

type SchoolRecord = {
  id: string;
  display_name?: string | null;
  legal_name?: string | null;
  school_code?: string | null;
  status?: string | null;
  central_metadata?: Record<string, unknown> | null;
};

function normalizeSchoolStatus(value: unknown): TrustedSchoolPresentation['status'] {
  return String(value || '').trim().toLowerCase() === 'active' ? 'active' : 'frozen';
}

function normalizePortalProfile(value: unknown): TrustedSchoolPresentation['portalProfile'] {
  return value === 'customer_production' ? 'customer_production' : 'standard';
}

export function toTrustedSchoolPresentation(record: SchoolRecord): TrustedSchoolPresentation {
  const id = String(record.id || '').trim();
  const name = String(record.display_name || record.legal_name || id).trim();
  if (!id || !name) throw new Error('Trusted school record is incomplete.');

  const rawFeatures = record.central_metadata?.features;
  const features = rawFeatures && typeof rawFeatures === 'object' && !Array.isArray(rawFeatures)
    ? Object.fromEntries(Object.entries(rawFeatures).filter(([, value]) => typeof value === 'boolean')) as Record<string, boolean>
    : {};

  return {
    id,
    name,
    logo: '🏫',
    type: 'private',
    licenseNumber: String(record.school_code || '').trim(),
    address: '',
    phone: '',
    email: '',
    academicYear: '',
    status: normalizeSchoolStatus(record.status),
    portalProfile: normalizePortalProfile(record.central_metadata?.portal_profile),
    features,
    connectedDb: 'trusted-school-scope'
  };
}

export async function resolveTrustedSchoolPresentation(
  supabase: SupabaseClient,
  schoolId: string
): Promise<TrustedSchoolPresentation | null> {
  const trustedSchoolId = String(schoolId || '').trim();
  if (!trustedSchoolId) return null;

  const { data, error } = await supabase
    .from('schools')
    .select('id, school_code, legal_name, display_name, status, central_metadata')
    .eq('id', trustedSchoolId)
    .maybeSingle();

  if (error || !data) return null;
  const school = toTrustedSchoolPresentation(data as SchoolRecord);
  const { data: academicYear } = await supabase
    .from('academic_years')
    .select('name, code')
    .eq('school_id', trustedSchoolId)
    .eq('is_current', true)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('starts_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  school.academicYear = String(academicYear?.name || academicYear?.code || '').trim();
  return school.id === trustedSchoolId ? school : null;
}

export type TrustedBranchPresentation = {
  id: string;
  schoolId: string;
  name: string;
  city: string;
};
type BranchRecord = {
  id: string;
  school_id?: string | null;
  name?: string | null;
  address?: Record<string, unknown> | null;
  status?: string | null;
  deleted_at?: string | null;
};
export function toTrustedBranchPresentation(record: BranchRecord): TrustedBranchPresentation {
  const id = String(record.id || '').trim();
  const schoolId = String(record.school_id || '').trim();
  const name = String(record.name || id).trim();
  const address = record.address && typeof record.address === 'object' ? record.address : {};
  const city = String(address.city || address.town || '').trim();
  if (!id || !schoolId || !name) throw new Error('Trusted branch record is incomplete.');
  return { id, schoolId, name, city };
}
export async function resolveTrustedBranchPresentation(
  supabase: SupabaseClient,
  branchId: string,
  schoolId: string
 ): Promise<TrustedBranchPresentation | null> {
  const trustedBranchId = String(branchId || '').trim();
  const trustedSchoolId = String(schoolId || '').trim();
  if (!trustedBranchId || !trustedSchoolId) return null;
  const { data, error } = await supabase
    .from('branches')
    .select('id, school_id, name, address, status, deleted_at')
    .eq('id', trustedBranchId)
    .eq('school_id', trustedSchoolId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (error || !data) return null;
  const branch = toTrustedBranchPresentation(data as BranchRecord);
  return branch.id === trustedBranchId && branch.schoolId === trustedSchoolId ? branch : null;
}
