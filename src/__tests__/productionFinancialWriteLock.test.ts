import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production financial write safety gate', () => {
  it('keeps the Cloudflare production worker fail-closed by default and in deployment', () => {
    const wrangler = fs.readFileSync(path.resolve(process.cwd(), 'wrangler.jsonc'), 'utf8');
    const workflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/cloudflare-production.yml'), 'utf8');

    expect(wrangler).toContain('"FINANCIAL_WRITES_LOCKED": "true"');
    expect(workflow).toContain('--var "FINANCIAL_WRITES_LOCKED:true"');
    expect(workflow).toContain("VITE_FINANCIAL_WRITES_ENABLED: 'false'");
    expect(workflow).not.toContain('--var "FINANCIAL_WRITES_LOCKED:false"');
  });
});
