import { AuditRepository } from '../database/repositories/AuditRepository';
import { AuthorizationDecision } from './AuthorizationEngine';
import { AuthorizationIdentity } from './RoleResolver';

export type AuthorizationAuditEvent = {
  userId: string;
  userName: string;
  role: string;
  permission: string;
  resource: string;
  schoolId: string;
  branchId: string;
  time: string;
  reason: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
};

export type AuthorizationAuditSink = (event: AuthorizationAuditEvent) => Promise<void> | void;

const events: AuthorizationAuditEvent[] = [];

const defaultSink: AuthorizationAuditSink = async event => {
  events.push(event);
  try {
    await AuditRepository.log(
      event.schoolId || 'unknown_school',
      event.userId || 'unknown_user',
      event.userName || 'Unknown user',
      event.role || 'unknown',
      'AUTHORIZATION_DENIED',
      'Authorization',
      event.ipAddress || 'unknown',
      JSON.stringify({
        permission: event.permission,
        resource: event.resource,
        branch: event.branchId,
        time: event.time,
        reason: event.reason,
        endpoint: event.endpoint,
        method: event.method
      }),
      { endpoint: event.endpoint || '', httpMethod: event.method || '', result: 'denied', severity: 'high' }
    );
  } catch {
    // Authorization denial must remain a denial even if audit persistence is unavailable.
  }
};

let sink: AuthorizationAuditSink = defaultSink;

export function setAuthorizationAuditSink(nextSink: AuthorizationAuditSink): void {
  sink = nextSink;
}

export function getAuthorizationAuditEvents(): AuthorizationAuditEvent[] {
  return [...events];
}

export function clearAuthorizationAuditEvents(): void {
  events.length = 0;
}

export async function recordAuthorizationDenial(
  identity: AuthorizationIdentity | null | undefined,
  decision: AuthorizationDecision,
  context: { schoolId?: string; branchId?: string; endpoint?: string; method?: string; ipAddress?: string } = {}
): Promise<void> {
  await sink({
    userId: String(identity?.id || 'unknown_user'),
    userName: String(identity?.name || identity?.email || 'Unknown user'),
    role: String(identity?.role || decision.role || 'unknown'),
    permission: decision.permission,
    resource: decision.resource,
    schoolId: String(context.schoolId || identity?.schoolId || 'unknown_school'),
    branchId: String(context.branchId || 'unknown_branch'),
    time: new Date().toISOString(),
    reason: decision.reason,
    endpoint: context.endpoint,
    method: context.method,
    ipAddress: context.ipAddress
  });
}
