import { describe, expect, it } from 'vitest';
import {
  isDiagnosticInvocationAvailable,
  isStagingDiagnosticHost,
  parseApprovedConnectionIdentity
} from '../security/stagingDiagnosticInvocation';

const approvedPayload = {
  data: {
    unitOfWork: {
      current_user: 'edupro_staging_app',
      session_user: 'edupro_staging_app',
      rolsuper: false,
      rolbypassrls: false,
      password: 'must-not-cross-ui-contract'
    },
    pool: { user: 'edupro_staging_app' }
  }
};

describe('staging diagnostic invocation contract', () => {
  it('exposes only the four approved identity fields', () => {
    expect(parseApprovedConnectionIdentity(approvedPayload)).toEqual({
      current_user: 'edupro_staging_app',
      session_user: 'edupro_staging_app',
      rolsuper: false,
      rolbypassrls: false
    });
  });

  it('rejects incomplete or malformed identity payloads', () => {
    expect(parseApprovedConnectionIdentity({ data: { unitOfWork: { current_user: 'x' } } })).toBeNull();
    expect(isDiagnosticInvocationAvailable(401, approvedPayload)).toBe(false);
    expect(isDiagnosticInvocationAvailable(404, approvedPayload)).toBe(false);
  });

  it('accepts only a successful response with approved identity data', () => {
    expect(isDiagnosticInvocationAvailable(200, approvedPayload)).toBe(true);
  });

  it('allows only the canonical staging hostname', () => {
    expect(isStagingDiagnosticHost('edupro-school-erp-staging.onrender.com')).toBe(true);
    expect(isStagingDiagnosticHost('EDUPRO-SCHOOL-ERP-STAGING.ONRENDER.COM')).toBe(true);
    expect(isStagingDiagnosticHost('edupro-school-erp.onrender.com')).toBe(false);
    expect(isStagingDiagnosticHost('localhost')).toBe(false);
  });
});
