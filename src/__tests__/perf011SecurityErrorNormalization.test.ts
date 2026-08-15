import { describe, expect, it } from 'vitest';
import { TenantIsolationError } from '../tenant/TenantEngine';
import { AuthorizationError, DatabaseError } from '../utils/errors';
import { normalizeStudentReadError } from '../middleware/studentReadError';

describe('PERF-011 Student Read error normalization', () => {
  it('maps tenant isolation failures to a generic 403 without details', () => {
    const normalized = normalizeStudentReadError(new TenantIsolationError('INVALID_BRANCH', 'internal branch detail'));
    expect(normalized).toMatchObject({ statusCode: 403, errorCode: 'AUTHORIZATION_ERROR', details: null });
    expect(normalized.message).not.toContain('branch');
  });

  it('keeps authorization failures as 403 without exposing internal details', () => {
    const normalized = normalizeStudentReadError(new AuthorizationError('internal authorization detail', { secret: 'hidden' }));
    expect(normalized).toMatchObject({ statusCode: 403, errorCode: 'AUTHORIZATION_ERROR', details: null });
    expect(normalized.message).not.toContain('internal');
  });

  it('keeps unexpected failures as generic 500 database errors', () => {
    const normalized = normalizeStudentReadError(new Error('SQL connection string must not be exposed'));
    expect(normalized).toMatchObject({ statusCode: 500, errorCode: 'DATABASE_ERROR', details: null });
    expect(normalized.message).not.toContain('connection string');
    expect(normalized).toBeInstanceOf(DatabaseError);
  });
});
