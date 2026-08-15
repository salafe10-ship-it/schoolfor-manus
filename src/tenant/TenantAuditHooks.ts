import { AuditRepository } from '../database/repositories/AuditRepository';
import type { TrustedIdentity } from '../middleware/trustedAuthentication';
import type { TenantContext } from './TenantContext';

export type TenantAuditEvent = {
  userId: string; role: string; tenantId: string; schoolId: string; branchId: string; academicYear: string;
  targetResource: string; request: string; time: string; ipAddress: string; reason: string;
  targetTenant?: string; targetSchool?: string; targetBranch?: string;
};
type TenantAuditSink = (event: TenantAuditEvent) => void | Promise<void>;
const events: TenantAuditEvent[] = [];
const defaultSink: TenantAuditSink = async event => {
  events.push(event);
  try {
    await AuditRepository.log(event.schoolId || 'unknown_school', event.userId || 'unknown_user', event.userId || 'unknown_user', event.role || 'unknown', 'TENANT_ACCESS_DENIED', 'TenantIsolation', event.ipAddress, JSON.stringify(event));
  } catch {
    // Denials remain denials even if persistent audit storage is unavailable.
  }
};
let sink: TenantAuditSink = defaultSink;
export function setTenantAuditSink(next: TenantAuditSink): void { sink = next; }
export function getTenantAuditEvents(): readonly TenantAuditEvent[] { return events; }
export function clearTenantAuditEvents(): void { events.length = 0; }
export async function recordTenantDenial(identity: TrustedIdentity | null | undefined, context: TenantContext | undefined, request: { method?: string; url?: string; ipAddress?: string }, reason: string, target: { resource?: string; tenantId?: string; schoolId?: string; branchId?: string } = {}): Promise<void> {
  const event: TenantAuditEvent = {
    userId: String(identity?.id || context?.userId || 'unknown_user'), role: String(identity?.role || context?.role || 'unknown'),
    tenantId: String(context?.tenantId || target.tenantId || 'unknown_tenant'), schoolId: String(context?.schoolId || target.schoolId || 'unknown_school'),
    branchId: String(context?.branchId || target.branchId || 'unknown_branch'), academicYear: String(context?.academicYear || 'unknown_academic_year'),
    targetResource: String(target.resource || request.url || 'unknown_resource'), request: `${request.method || 'UNKNOWN'} ${request.url || 'unknown_url'}`,
    time: new Date().toISOString(), ipAddress: String(request.ipAddress || 'unknown'), reason,
    ...(target.tenantId ? { targetTenant: target.tenantId } : {}), ...(target.schoolId ? { targetSchool: target.schoolId } : {}), ...(target.branchId ? { targetBranch: target.branchId } : {})
  };
  await sink(event);
}
