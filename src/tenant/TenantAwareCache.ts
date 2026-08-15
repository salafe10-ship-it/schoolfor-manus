import type { TenantContext } from './TenantContext';

type CacheEntry<T> = { value: T; expiresAt: number };

export class TenantAwareCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  constructor(private readonly ttlMs = 30_000, private readonly maxEntries = 256) {}
  private key(context: TenantContext, key: string): string {
    return [context.tenantId, context.schoolId, context.branchId, context.academicYear, key].join('::');
  }
  get(context: TenantContext, key: string): T | undefined {
    const cacheKey = this.key(context, key);
    const entry = this.entries.get(cacheKey);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) { this.entries.delete(cacheKey); return undefined; }
    return entry.value;
  }
  set(context: TenantContext, key: string, value: T): void {
    if (this.entries.size >= this.maxEntries) {
      const first = this.entries.keys().next().value;
      if (first) this.entries.delete(first);
    }
    this.entries.set(this.key(context, key), { value, expiresAt: Date.now() + this.ttlMs });
  }
  clearTenant(context: TenantContext): void {
    const prefix = [context.tenantId, context.schoolId, context.branchId, context.academicYear].join('::') + '::';
    for (const key of this.entries.keys()) if (key.startsWith(prefix)) this.entries.delete(key);
  }
  clear(): void { this.entries.clear(); }
}
