import { AuthorizationError } from '../utils/errors';

/**
 * Student write workflows are server-only. Browser callers must use the
 * protected Student Affairs API so authentication, authorization, tenant
 * validation and audit metadata are applied by the server.
 */
export function assertTrustedStudentServerExecution(): void {
  if (typeof window !== 'undefined') {
    throw new AuthorizationError('Student Affairs writes must use the trusted server API.');
  }
}
