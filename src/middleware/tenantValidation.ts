import express from 'express';
import type { TrustedIdentity } from './trustedAuthentication';
import { runWithTenantContext } from '../tenant/TenantContext';
import { recordTenantDenial } from '../tenant/TenantAuditHooks';
import { TenantIsolationError, tenantEngine } from '../tenant/TenantEngine';
import type { Perf004TraceLike } from '../performance/Perf004LatencyDiagnostics';

function valueFromRequest(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return undefined;
}
export function requestTarget(req: express.Request) {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  return {
    tenantId: valueFromRequest(req.headers['x-tenant-id']) || valueFromRequest(req.query.tenantId) || valueFromRequest(body.tenantId) || valueFromRequest(body.tenant_id),
    schoolId: valueFromRequest(req.headers['x-school-id']) || valueFromRequest(req.query.schoolId) || valueFromRequest(body.schoolId) || valueFromRequest(body.school_id),
    branchId: valueFromRequest(req.headers['x-branch-id']) || valueFromRequest(req.query.branchId) || valueFromRequest(body.branchId) || valueFromRequest(body.branch_id),
    academicYear: valueFromRequest(req.headers['x-academic-year']) || valueFromRequest(req.query.academicYear) || valueFromRequest(body.academicYear) || valueFromRequest(body.academic_year)
  };
}
export function createTenantValidationMiddleware() {
  return async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const identity = (req as any).user as TrustedIdentity | undefined;
    const target = requestTarget(req);
    try {
      const diagnosticTrace = (req as any).perf004Trace as Perf004TraceLike | undefined;
      const context = tenantEngine.validate(await tenantEngine.resolve(identity, (req as any).trustedAccessToken, diagnosticTrace));
      tenantEngine.assertRequestTarget(context, target);
      (req as any).tenantContext = context;
      runWithTenantContext(context, () => next());
    } catch (error: any) {
      await recordTenantDenial(identity, (req as any).tenantContext, { method: req.method, url: req.originalUrl, ipAddress: req.ip || 'unknown' }, error instanceof TenantIsolationError ? error.reason : 'TENANT_VALIDATION_FAILED', { resource: req.originalUrl, tenantId: target.tenantId, schoolId: target.schoolId, branchId: target.branchId });
      next(error instanceof TenantIsolationError ? error : new TenantIsolationError('TENANT_VALIDATION_FAILED', 'تعذر التحقق من سياق المستأجر.'));
    }
  };
}
export const tenantValidationMiddleware = createTenantValidationMiddleware();
