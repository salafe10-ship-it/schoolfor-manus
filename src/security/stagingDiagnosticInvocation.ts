export type ApprovedConnectionIdentity = {
  current_user: string;
  session_user: string;
  rolsuper: boolean;
  rolbypassrls: boolean;
};

export function isStagingDiagnosticHost(hostname: string): boolean {
  return hostname.trim().toLowerCase() === 'edupro-school-erp-staging.onrender.com';
}

const IDENTITY_KEYS = ['current_user', 'session_user', 'rolsuper', 'rolbypassrls'] as const;

function isApprovedIdentity(value: unknown): value is ApprovedConnectionIdentity {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return IDENTITY_KEYS.every((key) => key in candidate)
    && typeof candidate.current_user === 'string'
    && typeof candidate.session_user === 'string'
    && typeof candidate.rolsuper === 'boolean'
    && typeof candidate.rolbypassrls === 'boolean';
}

export function parseApprovedConnectionIdentity(payload: unknown): ApprovedConnectionIdentity | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload as Record<string, unknown>).data;
  if (!data || typeof data !== 'object') return null;

  const unitOfWork = (data as Record<string, unknown>).unitOfWork;
  return isApprovedIdentity(unitOfWork) ? {
    current_user: unitOfWork.current_user,
    session_user: unitOfWork.session_user,
    rolsuper: unitOfWork.rolsuper,
    rolbypassrls: unitOfWork.rolbypassrls
  } : null;
}

export function isDiagnosticInvocationAvailable(status: number, payload: unknown): boolean {
  return status >= 200 && status < 300 && parseApprovedConnectionIdentity(payload) !== null;
}
