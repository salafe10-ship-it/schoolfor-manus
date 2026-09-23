import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('identity review and SoD schema', () => {
  it('defines review and segregation rules without seeded decisions', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/202609231200_identity_review_sod.sql'), 'utf8');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_access_reviews');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.identity_sod_rules');
    expect(migration).toContain('FORCE ROW LEVEL SECURITY');
    expect(migration).toContain('due_at');
    expect(migration).toContain('permission_snapshot');
    expect(migration).not.toContain('INSERT INTO');
    expect(readFileSync(resolve(process.cwd(), 'scripts/apply-identity-structure-migrations.ts'), 'utf8')).toContain('202609231200_identity_review_sod.sql');
  });

  it('requires review generation to snapshot effective permissions from the database', () => {
    const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const reviewGeneration = server.slice(server.indexOf("app.post('/api/school/access-reviews/generate'"), server.indexOf("app.patch('/api/school/access-reviews/:reviewId/decision'"));
    expect(reviewGeneration).toContain('jsonb_agg');
    expect(reviewGeneration).toContain("entries.effect='allow'");
    expect(reviewGeneration).toContain('upg.ends_at>now()');
    expect(reviewGeneration).toContain("denied.effect='deny'");
    expect(reviewGeneration).not.toContain("now() + interval '90 days', '[]'::jsonb");
  });
});
