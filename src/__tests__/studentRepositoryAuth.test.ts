import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  authenticatedRequest: vi.fn()
}));

vi.mock('../utils/authenticatedRequest', () => requestMock);

import { StudentRepository } from '../components/student-affairs/repository/StudentRepository';

describe('StudentRepository authentication boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses authenticatedRequest for POST /api/students without changing the endpoint or DTO', async () => {
    requestMock.authenticatedRequest.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 'student-1' } })
    });

    await expect(StudentRepository.saveStudent({ name: 'UAT SAVE FIX TEST' })).resolves.toMatchObject({ success: true });
    expect(requestMock.authenticatedRequest).toHaveBeenCalledWith('/api/students', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'UAT SAVE FIX TEST' })
    }));
  });

  it('does not send a raw fetch when authentication fails before the repository layer', async () => {
    requestMock.authenticatedRequest.mockRejectedValue(new Error('Authentication session expired. Please sign in again.'));

    await expect(StudentRepository.saveStudent({ name: 'UAT SAVE FIX TEST' }))
      .rejects.toThrow('Authentication session expired. Please sign in again.');
    expect(requestMock.authenticatedRequest).toHaveBeenCalledTimes(1);
  });
});
