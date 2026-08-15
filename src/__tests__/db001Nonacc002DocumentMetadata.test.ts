import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(process.cwd(), 'src/database/repositories/DocumentRepository.ts'),
  'utf8'
);

describe('DB-001-NONACC-002 document metadata persistence gate', () => {
  it('proves saveMetadata currently uses a no-op canonical writer', () => {
    const start = source.indexOf('public async saveMetadata');
    const end = source.indexOf('private mapFromDatabase', start);
    const method = source.slice(start, end);

    expect(method).toContain("'dms_documents'");
    expect(method).toContain('async () => { /* Supabase implementation */ }');
    expect(method).toContain('() => { /* Fallback implementation */ }');
  });

  it('does not claim canonical persistence can be proven without an existing contract', () => {
    expect(source).not.toContain(".from('dms_documents').upsert");
    expect(source).not.toContain(".from('dms_documents').insert");
    expect(source).toContain('FallbackStorage.performWrite');
  });
});
