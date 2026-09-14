export interface SupabaseDatabaseTargetAlignment {
  expectedProjectRef: string | null;
  dataPlaneProjectRef: string | null;
  adminProjectRef: string | null;
  aligned: boolean;
  issues: string[];
}

const SUPABASE_PROJECT_REF = /^[a-z0-9]{20}$/i;

export function extractSupabaseProjectRef(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    const match = hostname.match(/^([a-z0-9]{20})\.supabase\.co$/i);
    return match?.[1]?.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function extractPostgresProjectRef(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const directMatch = hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/i);
    if (directMatch?.[1]) return directMatch[1].toLowerCase();

    // Supabase's shared pooler keeps the project ref in the database username:
    // <role>.<project-ref>@<region>.pooler.supabase.com
    const usernameParts = decodeURIComponent(url.username).split('.');
    const usernameRef = usernameParts.at(-1) || '';
    return SUPABASE_PROJECT_REF.test(usernameRef) ? usernameRef.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function inspectSupabaseDatabaseTargetAlignment(input: {
  supabaseUrl?: string;
  databaseUrl?: string;
  platformAdminDatabaseUrl?: string;
}): SupabaseDatabaseTargetAlignment {
  const expectedProjectRef = extractSupabaseProjectRef(input.supabaseUrl);
  const dataPlaneProjectRef = extractPostgresProjectRef(input.databaseUrl);
  const adminProjectRef = extractPostgresProjectRef(input.platformAdminDatabaseUrl);
  const issues: string[] = [];

  if (!expectedProjectRef) issues.push('SUPABASE_URL does not identify a Supabase project.');
  if (!dataPlaneProjectRef) issues.push('DATABASE_URL does not identify a Supabase project.');
  if (!adminProjectRef) issues.push('PLATFORM_ADMIN_DATABASE_URL does not identify a Supabase project.');

  if (expectedProjectRef && dataPlaneProjectRef && dataPlaneProjectRef !== expectedProjectRef) {
    issues.push('DATABASE_URL targets a different Supabase project than SUPABASE_URL.');
  }
  if (expectedProjectRef && adminProjectRef && adminProjectRef !== expectedProjectRef) {
    issues.push('PLATFORM_ADMIN_DATABASE_URL targets a different Supabase project than SUPABASE_URL.');
  }

  return {
    expectedProjectRef,
    dataPlaneProjectRef,
    adminProjectRef,
    aligned: issues.length === 0,
    issues,
  };
}
