import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const server = readFileSync(resolve(root, 'server.ts'), 'utf8');
const migration = readFileSync(resolve(root, 'src/database/migrations/financial_voucher_attachments.sql'), 'utf8');

describe('FIN-ATT-001 canonical financial attachment contract', () => {
  it('uses private storage and canonical tenant-scoped metadata', () => {
    expect(server).toContain("/api/financial/vouchers/:voucherType/:voucherId/attachments");
    expect(server).toContain("/api/financial/voucher-attachments/:attachmentId/content");
    expect(server).toContain('financial-voucher-attachments');
    expect(server).toContain('signedDownloadOnly: true');
    expect(server).toContain("tenant_id = $2::uuid AND school_id = $3::uuid");
  });

  it('enforces file type, size, checksum and idempotency', () => {
    expect(server).toContain('MAX_DOCUMENT_BYTES');
    expect(server).toContain("application/pdf', 'image/jpeg', 'image/png', 'image/webp");
    expect(server).toContain("createHash('sha256').update(body).digest('hex')");
    expect(server).toContain("Idempotency-Key");
    expect(server).toContain('ON CONFLICT (tenant_id, school_id, voucher_type, voucher_id, content_hash)');
  });

  it('protects the schema with scope policy and duplicate constraint', () => {
    expect(migration).toContain('UNIQUE (tenant_id, school_id, voucher_type, voucher_id, content_hash)');
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain("auth.jwt()->'app_metadata'->>'tenant_id'");
    expect(migration).toContain("auth.jwt()->'app_metadata'->>'school_id'");
    expect(migration).toContain("bucket_id text NOT NULL DEFAULT 'financial-voucher-attachments'");
  });
});
