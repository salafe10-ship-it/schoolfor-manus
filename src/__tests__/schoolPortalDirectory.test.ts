import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { resolveSchoolPortal } from '../../server/infrastructure/SchoolPortalDirectory';

const school = { id: 'be687819-4d8d-427f-8479-81c0b70c35e1', name: 'مدارس الأسرة الحديثة' };

describe('public school portal directory', () => {
  it('returns only the public school identity for one canonical match', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ ...school, privateMetadata: 'not-public' }] });
    const pool = { query } as unknown as Pick<Pool, 'query'>;
    await expect(resolveSchoolPortal(pool, ' Modern-Family-Schools ')).resolves.toEqual(school);
    expect(query.mock.calls[0][1]).toEqual(['modern-family-schools']);
  });

  it.each([{ rows: [] }, { rows: [school, { ...school, id: '11111111-1111-4111-8111-111111111111' }] }])(
    'fails closed for missing or ambiguous school matches', async ({ rows }) => {
      const pool = { query: vi.fn().mockResolvedValue({ rows }) } as unknown as Pick<Pool, 'query'>;
      await expect(resolveSchoolPortal(pool, 'shared-alias')).resolves.toBeNull();
    },
  );

  it('rejects an empty or oversized context before a database lookup', async () => {
    const query = vi.fn();
    const pool = { query } as unknown as Pick<Pool, 'query'>;
    await expect(resolveSchoolPortal(pool, '  ')).resolves.toBeNull();
    await expect(resolveSchoolPortal(pool, 'x'.repeat(101))).resolves.toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('passes a malicious alias as a query parameter without interpolating it', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const pool = { query } as unknown as Pick<Pool, 'query'>;
    const context = "school' OR 1=1 --";
    await expect(resolveSchoolPortal(pool, context)).resolves.toBeNull();
    expect(query.mock.calls[0][0]).not.toContain(context);
    expect(query.mock.calls[0][1]).toEqual([context.toLowerCase()]);
  });
});
