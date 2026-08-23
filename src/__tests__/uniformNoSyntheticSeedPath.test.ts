import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SchoolUniformManagement authoritative data contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/SchoolUniformManagement.tsx'), 'utf8');

  it('does not initialize operational collections from UniformSeeds', () => {
    expect(source).toContain('const [items, setItems] = useState<UniformItem[]>([]);');
    expect(source).toContain('const [purchaseOrders, setPurchaseOrders] = useState<UniformPurchaseOrder[]>([]);');
    expect(source).toContain('const [journals, setJournals] = useState<AccountingJournalEntry[]>([]);');
    expect(source).not.toContain('useState<UniformItem[]>(initialItems)');
    expect(source).not.toContain('useState<UniformPurchaseOrder[]>(initialPOs)');
  });

  it('does not expose hardcoded sales or chart evidence', () => {
    expect(source).toContain('const salesToday = 0;');
    expect(source).toContain('const totalRevenue = 0;');
    expect(source).toContain('const itemsSalesChart: { name: string; sales: number }[] = [];');
    expect(source).not.toContain('const salesToday = 2380;');
    expect(source).not.toContain("{ name: 'قمصان صبيان', sales: 420 }");
  });
});
